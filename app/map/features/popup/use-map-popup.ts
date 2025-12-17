// app/map/features/popup/use-map-popup.ts
"use client";

import type maplibregl from "maplibre-gl";
import { useEffect, useMemo, useState } from "react";
import type { PopupLayerGroup, PopupState } from "./types";

function isMapLibreMap(m: unknown): m is maplibregl.Map {
	return Boolean(
		m &&
			typeof m === "object" &&
			"on" in m &&
			"off" in m &&
			"queryRenderedFeatures" in m,
	);
}

function resolveMap(input: unknown): maplibregl.Map | null {
	if (isMapLibreMap(input)) return input;

	if (input && typeof input === "object" && "current" in input) {
		const cur = (input as { current?: unknown }).current;
		if (isMapLibreMap(cur)) return cur;
	}

	if (input && typeof input === "object" && "getMap" in input) {
		const fn = (input as { getMap?: unknown }).getMap;
		if (typeof fn === "function") {
			const m = (fn as () => unknown)();
			if (isMapLibreMap(m)) return m;
		}
	}

	if (input && typeof input === "object" && "map" in input) {
		const m = (input as { map?: unknown }).map;
		if (isMapLibreMap(m)) return m;
	}

	return null;
}

function pickStableId(props: Record<string, unknown>): string | null {
	const keys = ["id", "fid", "objectid", "OBJECTID", "uuid", "gid"];
	for (const k of keys) {
		const v = props[k];
		if (typeof v === "string" && v.trim()) return v;
		if (typeof v === "number" && Number.isFinite(v)) return String(v);
	}
	return null;
}

function featureKey(f: maplibregl.MapGeoJSONFeature): string {
	const src = typeof f.source === "string" ? f.source : "unknown-source";
	const srcLayer =
		typeof f.sourceLayer === "string" ? f.sourceLayer : "unknown-sourcelayer";

	const explicitId =
		typeof f.id === "string" || typeof f.id === "number" ? String(f.id) : null;

	const props =
		f.properties && typeof f.properties === "object"
			? (f.properties as Record<string, unknown>)
			: {};

	const stableId = explicitId ?? pickStableId(props);

	const fallback =
		stableId ??
		`${f.geometry?.type ?? "geom"}:${Object.keys(props)
			.slice(0, 3)
			.sort()
			.join(",")}`;

	return `${src}::${srcLayer}::${fallback}`;
}

function dedupe(
	features: maplibregl.MapGeoJSONFeature[],
): maplibregl.MapGeoJSONFeature[] {
	const seen = new Set<string>();
	const out: maplibregl.MapGeoJSONFeature[] = [];

	for (const f of features) {
		const k = featureKey(f);
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(f);
	}

	return out;
}

function groupByLayer(
	features: maplibregl.MapGeoJSONFeature[],
): PopupLayerGroup[] {
	const m = new Map<string, maplibregl.MapGeoJSONFeature[]>();

	for (const f of features) {
		const layerId = f.layer?.id ?? "unknown-layer";
		const arr = m.get(layerId);
		if (arr) arr.push(f);
		else m.set(layerId, [f]);
	}

	return [...m.entries()].map(([layerId, feats]) => ({
		layerId,
		features: feats,
	}));
}

function isUsefulFeature(f: maplibregl.MapGeoJSONFeature): boolean {
	return Boolean(f.geometry);
}

export function useMapPopup(
	mapLike: unknown,
	opts?: {
		interactiveLayerIds?: string[];
		interactiveSourceIds?: string[];
		tolerancePx?: number;
	},
) {
	const [state, setState] = useState<PopupState>({ open: false });

	const interactiveLayerIds = useMemo(
		() => opts?.interactiveLayerIds ?? null,
		[opts?.interactiveLayerIds],
	);

	const interactiveSourceIds = useMemo(
		() => opts?.interactiveSourceIds ?? null,
		[opts?.interactiveSourceIds],
	);

	const tolerancePx = opts?.tolerancePx ?? 0;

	useEffect(() => {
		const map = resolveMap(mapLike);
		if (!map) return;

		const onClick = (e: maplibregl.MapMouseEvent) => {
			const p = e.point;
			const bbox: [maplibregl.PointLike, maplibregl.PointLike] =
				tolerancePx > 0
					? [
							[p.x - tolerancePx, p.y - tolerancePx],
							[p.x + tolerancePx, p.y + tolerancePx],
						]
					: [p, p];

			const style = map.getStyle();
			const existingLayerIds = style?.layers?.map((l) => l.id) ?? [];

			const validLayerIds = interactiveLayerIds?.filter((id) =>
				existingLayerIds.includes(id),
			);

			const qOpts: maplibregl.QueryRenderedFeaturesOptions | undefined =
				validLayerIds && validLayerIds.length > 0
					? { layers: validLayerIds }
					: interactiveLayerIds
						? { layers: [] }
						: undefined;

			let hits = dedupe(
				map.queryRenderedFeatures(bbox, qOpts).filter(isUsefulFeature),
			);

			if (interactiveSourceIds) {
				hits = hits.filter((f) => {
					const src = typeof f.source === "string" ? f.source : null;
					return src ? interactiveSourceIds.includes(src) : false;
				});
			}

			if (hits.length === 0) {
				setState({ open: false });
				return;
			}

			// --- CLUSTER LOGIK FIX ---
			const clusterFeature = hits.find((f) => f.properties?.cluster);
			if (clusterFeature && clusterFeature.geometry.type === "Point") {
				const sourceId = clusterFeature.source;
				const clusterId = clusterFeature.id as number;
				const coords = (clusterFeature.geometry as GeoJSON.Point)
					.coordinates as [number, number];

				const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;

				if (source && typeof source.getClusterExpansionZoom === "function") {
					// Fix: Use Promise-based API
					source
						.getClusterExpansionZoom(clusterId)
						.then((zoom) => {
							map.easeTo({
								center: coords,
								zoom: zoom + 0.5,
							});
						})
						.catch(() => {
							// Ignore errors silently
						});

					setState({ open: false });
					return;
				}
			}

			const selected = hits.length === 1 ? [hits[0]] : hits;

			setState({
				open: true,
				lngLat: e.lngLat,
				groups: groupByLayer(selected),
			});
		};

		map.on("click", onClick);
		return () => {
			map.off("click", onClick);
		};
	}, [mapLike, interactiveLayerIds, interactiveSourceIds, tolerancePx]);

	return {
		popup: state,
		close: () => setState({ open: false }),
	};
}
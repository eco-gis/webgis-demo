// app/map/core/use-maplibre.ts
"use client";

import { mapTilerStyleUrl } from "@/app/lib/maptiler/styles";
import maplibregl, {
	type LayerSpecification,
	type LngLatLike,
	type Map as MaplibreMap,
	type SourceSpecification,
} from "maplibre-gl";
import * as pmtiles from "pmtiles";
import { useEffect, useRef, useState } from "react";

type UseMapLibreOptions = {
	containerRef: React.RefObject<HTMLDivElement | null>;
	center: LngLatLike;
	zoom: number;
	onLoad?: (map: MaplibreMap) => void;

	/** 0..1 (applies to basemap layers, overlays + app layers stay fully visible) */
	basemapOpacity?: number;
};

let pmtilesRegistered = false;

function ensurePmtilesProtocolRegistered(): void {
	if (pmtilesRegistered) return;

	const protocol = new pmtiles.Protocol();
	maplibregl.addProtocol("pmtiles", protocol.tile);

	pmtilesRegistered = true;
}

type OverlayStyle = {
	sources?: Record<string, SourceSpecification>;
	layers?: LayerSpecification[];
};

// ---- overlay cache (avoid refetch on every opacity change)
let overlaysCache: OverlayStyle | null = null;
let overlaysPromise: Promise<OverlayStyle> | null = null;

async function loadOverlayStyle(): Promise<OverlayStyle> {
	if (overlaysCache) return overlaysCache;
	if (overlaysPromise) return overlaysPromise;

	overlaysPromise = (async () => {
		const res = await fetch("/data/style.json", { cache: "no-store" });
		if (!res.ok) {
			throw new Error(`Failed to load /data/style.json (HTTP ${res.status})`);
		}

		const json = (await res.json()) as OverlayStyle;

		overlaysCache = {
			sources: json.sources ?? {},
			layers: json.layers ?? [],
		};

		return overlaysCache;
	})();

	try {
		return await overlaysPromise;
	} finally {
		overlaysPromise = null;
	}
}

function applyOverlays(map: MaplibreMap, overlays: OverlayStyle): void {
	const sources = overlays.sources ?? {};
	for (const [id, spec] of Object.entries(sources)) {
		if (!map.getSource(id)) map.addSource(id, spec);
	}

	const layers = overlays.layers ?? [];
	for (const layer of layers) {
		if (map.getLayer(layer.id)) continue;
		map.addLayer(layer);
	}
}

function clamp01(n: number): number {
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

function setLayerOpacity(
	map: MaplibreMap,
	layerId: string,
	type: LayerSpecification["type"],
	o: number,
): void {
	switch (type) {
		case "background":
			map.setPaintProperty(layerId, "background-opacity", o);
			return;

		case "fill":
			map.setPaintProperty(layerId, "fill-opacity", o);
			return;

		case "line":
			map.setPaintProperty(layerId, "line-opacity", o);
			return;

		case "circle":
			map.setPaintProperty(layerId, "circle-opacity", o);
			map.setPaintProperty(layerId, "circle-stroke-opacity", o);
			return;

		case "symbol":
			map.setPaintProperty(layerId, "icon-opacity", o);
			map.setPaintProperty(layerId, "text-opacity", o);
			return;

		case "raster":
			map.setPaintProperty(layerId, "raster-opacity", o);
			return;

		case "fill-extrusion":
			map.setPaintProperty(layerId, "fill-extrusion-opacity", o);
			return;

		case "heatmap":
			map.setPaintProperty(layerId, "heatmap-opacity", o);
			return;

		default:
			return;
	}
}

const APP_LAYER_PREFIXES = ["dummy-", "draw-", "search-marker"] as const;

function isAppLayer(id: string): boolean {
	return APP_LAYER_PREFIXES.some((p) => id.startsWith(p));
}

function applyBasemapOpacity(
	map: MaplibreMap,
	overlays: OverlayStyle,
	opacity: number,
): void {
	const o = clamp01(opacity);
	const overlayLayerIds = new Set((overlays.layers ?? []).map((l) => l.id));

	const style = map.getStyle();
	if (!style || !style.layers) return;

	for (const l of style.layers) {
		if (overlayLayerIds.has(l.id)) continue;
		if (isAppLayer(l.id)) continue;

		if (map.getLayer(l.id)) {
			setLayerOpacity(map, l.id, l.type, o);
		}
	}
}

export function useMapLibre({
		containerRef,
		center,
		zoom,
		onLoad,
		basemapOpacity = 1,
	}: UseMapLibreOptions): {
		map: MaplibreMap | null;
		overlays: OverlayStyle | null;
	} {
		const mapRef = useRef<MaplibreMap | null>(null);
		const overlaysRef = useRef<OverlayStyle | null>(null);

		const centerRef = useRef<LngLatLike>(center);
		const zoomRef = useRef<number>(zoom);
		const opacityRef = useRef<number>(basemapOpacity);
		const onLoadRef = useRef<UseMapLibreOptions["onLoad"]>(undefined);

		const [map, setMap] = useState<MaplibreMap | null>(null);

		useEffect(() => {
			centerRef.current = center;
		}, [center]);

		useEffect(() => {
			zoomRef.current = zoom;
		}, [zoom]);

		useEffect(() => {
			opacityRef.current = basemapOpacity;
		}, [basemapOpacity]);

		onLoadRef.current = onLoad;

		useEffect(() => {
			const container = containerRef.current;
			if (!container) return;
			if (mapRef.current) return;

			ensurePmtilesProtocolRegistered();

			const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
			if (!key) {
				console.error("Missing NEXT_PUBLIC_MAPTILER_KEY in environment.");
				return;
			}

			let cancelled = false;

			(async () => {
				const overlays = await loadOverlayStyle();
				if (cancelled) return;

				overlaysRef.current = overlays;

				const baseStyleUrl = mapTilerStyleUrl("ch-swisstopo-lbm");

				const m = new maplibregl.Map({
					container,
					style: baseStyleUrl,
					center: centerRef.current,
					zoom: zoomRef.current,
					maxZoom: 22,
				});

				m.dragPan.enable({ linearity: 0.3 });
				m.scrollZoom.enable();
				m.doubleClickZoom.enable();
				m.keyboard.enable();
				m.touchZoomRotate.enable({ around: "center" });
				m.touchPitch.enable();

				if (process.env.NODE_ENV === "development") {
					(window as unknown as { __MAP__?: MaplibreMap }).__MAP__ = m;
				}

				m.addControl(
					new maplibregl.NavigationControl({ visualizePitch: true }),
					"top-right",
				);
				m.addControl(
					new maplibregl.ScaleControl({ unit: "metric" }),
					"bottom-left",
				);

				m.on("style.load", () => {
					const ov = overlaysRef.current;
					if (!ov) return;
					applyBasemapOpacity(m, ov, opacityRef.current);
				});

				m.on("load", () => {
					applyOverlays(m, overlays);
					applyBasemapOpacity(m, overlays, opacityRef.current);
					onLoadRef.current?.(m);
				});

				mapRef.current = m;
				setMap(m);
			})().catch((err: unknown) => {
				console.error("Map init failed:", err);
			});

			return () => {
				cancelled = true;
				mapRef.current?.remove();
				mapRef.current = null;
				overlaysRef.current = null;
				setMap(null);
			};
		}, [containerRef]);

		useEffect(() => {
			const m = mapRef.current;
			const ov = overlaysRef.current;
			if (!m || !ov) return;

			applyBasemapOpacity(m, ov, basemapOpacity);
		}, [basemapOpacity]);

		return {
			map,
			overlays: overlaysRef.current,
		};
	}

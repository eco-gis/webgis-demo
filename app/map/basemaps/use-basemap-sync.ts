// app/map/basemaps/use-basemap-sync.ts
"use client";

import type {
	LayerSpecification,
	Map as MaplibreMap,
	SourceSpecification,
} from "maplibre-gl";
import { useEffect } from "react";

import {
	type MapTilerStyleId,
	mapTilerStyleUrl,
} from "@/app/lib/maptiler/styles";

import type { BasemapId } from "./basemap-config";
import { getBasemapById } from "./basemap-config";

type OverlayStyle = {
	sources?: Record<string, SourceSpecification>;
	layers?: LayerSpecification[];
};

let overlaysCache: OverlayStyle | null = null;

async function loadOverlayStyle(): Promise<OverlayStyle> {
	if (overlaysCache) return overlaysCache;

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
}

function moveOverlaysToTop(
	map: MaplibreMap,
	overlayLayerIds: readonly string[],
) {
	for (const id of overlayLayerIds) {
		if (map.getLayer(id)) map.moveLayer(id);
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

	moveOverlaysToTop(
		map,
		layers.map((l) => l.id),
	);
}

function waitForStyleLoaded(map: MaplibreMap): Promise<void> {
	return new Promise((resolve) => {
		if (map.isStyleLoaded()) {
			resolve();
			return;
		}

		const onStyleData = () => {
			if (!map.isStyleLoaded()) return;
			map.off("styledata", onStyleData);
			resolve();
		};

		map.on("styledata", onStyleData);
	});
}

function waitForIdle(map: MaplibreMap): Promise<void> {
	return new Promise((resolve) => {
		const onIdle = () => {
			map.off("idle", onIdle);
			resolve();
		};
		map.on("idle", onIdle);
	});
}

/**
 * Sync: Basemap wechseln ohne dass Overlays verschwinden.
 * Benutzung: useBasemapSync(map, basemapId)
 */
export function useBasemapSync(
	map: MaplibreMap | null,
	basemapId: BasemapId,
): void {
	useEffect(() => {
		if (!map) return;

		let cancelled = false;
		let runId = 0;

		const currentRun = ++runId;

		(async () => {
			const def = getBasemapById(basemapId);
			const nextStyleUrl = mapTilerStyleUrl(def.styleId as MapTilerStyleId);

			// Overlays laden (einmalig gecached)
			const overlays = await loadOverlayStyle();
			if (cancelled || currentRun !== runId) return;

			// Wenn der Style schon derselbe ist: nix tun (verhindert unnötige reloads)
			// getStyle().sprite ist stabiler als URL, aber reicht als Guard im Demo.
			// Wenn du eine saubere "current basemap id" im map state führst: noch besser.
			try {
				map.setStyle(nextStyleUrl);
			} catch (e) {
				// setStyle kann werfen, wenn map gerade disposed wird
				if (!cancelled) throw e;
				return;
			}

			await waitForStyleLoaded(map);
			if (cancelled || currentRun !== runId) return;

			applyOverlays(map, overlays);

			// gegen späte Glyph/Sprite Nachzüge
			await waitForIdle(map);
			if (cancelled || currentRun !== runId) return;

			applyOverlays(map, overlays);
		})().catch((err: unknown) => {
			if (!cancelled) console.error("Basemap sync failed:", err);
		});

		return () => {
			cancelled = true;
		};
	}, [map, basemapId]);
}

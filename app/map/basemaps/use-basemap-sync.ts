"use client";

import {
	type MapTilerStyleId,
	mapTilerStyleUrl,
} from "@/app/lib/maptiler/styles";
import type {
	LayerSpecification,
	Map as MaplibreMap,
	SourceSpecification,
} from "maplibre-gl";
import { useEffect } from "react";
import type { BasemapId } from "./basemap-config";
import { getBasemapById } from "./basemap-config";

type OverlayStyle = {
	sources?: Record<string, SourceSpecification>;
	layers?: LayerSpecification[];
};

// Cache: Overlays laden wir nur einmal (werden bei stylewechsel wieder angewendet)
let overlaysCache: OverlayStyle | null = null;

async function loadOverlayStyle(): Promise<OverlayStyle> {
	if (overlaysCache) return overlaysCache;

	const res = await fetch("/data/style.json", { cache: "no-store" });
	if (!res.ok) {
		throw new Error(`Failed to load /data/style.json (HTTP ${res.status})`);
	}

	const json = (await res.json()) as OverlayStyle;

	// Defensive: niemals undefined lassen
	overlaysCache = {
		sources: json.sources ?? {},
		layers: json.layers ?? [],
	};

	return overlaysCache;
}

/**
 * Overlays müssen über der Basemap liegen.
 * Dafür werden sie nach dem Hinzufügen immer nach oben verschoben.
 */
function moveOverlaysToTop(
	map: MaplibreMap,
	overlayLayerIds: readonly string[],
): void {
	for (const id of overlayLayerIds) {
		if (map.getLayer(id)) {
			// ohne beforeId => ganz nach oben
			map.moveLayer(id);
		}
	}
}

/**
 * Fügt Quellen & Layer (idempotent) hinzu.
 * Danach werden Overlay-Layer ganz nach oben verschoben (Basemap bleibt hinten).
 */
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

/**
 * Wartet bis der neue Style wirklich geladen ist.
 * style.load ist nicht immer zuverlässig bei setStyle + externen Styles.
 */
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

/**
 * Wartet, bis die Map "idle" ist (Tiles/Sprites/Glyphs nachgeladen).
 * MapTiler-Styles können nach style-loaded noch nachziehen.
 */
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
 * Wichtig: BasemapGallery darf NICHT map.setStyle aufrufen, sondern nur basemapId setzen.
 */
export function useBasemapSync(params: {
	map: MaplibreMap | null;
	basemapId: BasemapId;
}): void {
	const { map, basemapId } = params;

	useEffect(() => {
		if (!map) return;

		let cancelled = false;

		(async () => {
			const def = getBasemapById(basemapId);

			// Basemap URL aus Config
			const nextStyleUrl = mapTilerStyleUrl(def.styleId as MapTilerStyleId);

			// Overlays sicher im Cache
			const overlays = await loadOverlayStyle();
			if (cancelled) return;

			// Style wechseln (killt sources/layers)
			map.setStyle(nextStyleUrl);

			// 1) warten bis style geladen ist
			await waitForStyleLoaded(map);
			if (cancelled) return;

			// 2) overlays direkt anwenden
			applyOverlays(map, overlays);

			// 3) und nochmals nach idle (gegen späte Style-Änderungen)
			await waitForIdle(map);
			if (cancelled) return;

			applyOverlays(map, overlays);
		})().catch((err: unknown) => {
			console.error("Basemap sync failed:", err);
		});

		return () => {
			cancelled = true;
		};
	}, [map, basemapId]);
}

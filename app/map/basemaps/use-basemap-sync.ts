"use client";

import {
	type MapTilerStyleId,
	mapTilerStyleUrl,
} from "@/app/lib/maptiler/styles";
import { reorderAppLayers } from "@/app/map/core/layer-order";
import type {
	LayerSpecification,
	Map as MaplibreMap,
	SourceSpecification,
} from "maplibre-gl";
import { useEffect, useRef } from "react";
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
	if (!res.ok)
		throw new Error(`Failed to load /data/style.json (HTTP ${res.status})`);

	const json = (await res.json()) as OverlayStyle;
	overlaysCache = { sources: json.sources ?? {}, layers: json.layers ?? [] };
	return overlaysCache;
}

function applyOverlays(map: MaplibreMap, overlays: OverlayStyle): void {
	// 1. Quellen hinzufügen
	for (const [id, spec] of Object.entries(overlays.sources ?? {})) {
		if (!map.getSource(id)) map.addSource(id, spec);
	}
	// 2. Layer hinzufügen (sie landen initial am Ende des Stacks)
	for (const layer of overlays.layers ?? []) {
		if (!map.getLayer(layer.id)) {
			map.addLayer(layer);
		}
	}
	// 3. SOFORT sortieren, sobald alle Layer da sind
	reorderAppLayers(map);
}

function waitForStyleLoad(map: MaplibreMap): Promise<void> {
	return new Promise((resolve) => {
		if (map.isStyleLoaded()) return resolve();
		map.once("style.load", () => resolve());
	});
}

export function useBasemapSync(
	map: MaplibreMap | null,
	basemapId: BasemapId,
): void {
	const runRef = useRef(0);

	useEffect(() => {
		if (!map) return;

		let cancelled = false;
		const run = ++runRef.current;

		// stabile Funktion-Referenz pro Run
		const keepOrderStable = () => {
			// Wichtig: hier auch WMS berücksichtigen -> Prefix "wms-" ist in reorderAppLayers drin
			reorderAppLayers(map);
		};

		// keine doppelten Listener
		map.off("styledata", keepOrderStable);

		(async () => {
			const def = getBasemapById(basemapId);
			const nextStyleUrl = mapTilerStyleUrl(def.styleId as MapTilerStyleId);

			const overlays = await loadOverlayStyle();
			if (cancelled || run !== runRef.current) return;

			map.setStyle(nextStyleUrl);

			await waitForStyleLoad(map);
			if (cancelled || run !== runRef.current) return;

			applyOverlays(map, overlays);

			// Initial + dauerhaft stabil halten
			keepOrderStable();
			map.on("styledata", keepOrderStable);
		})().catch((err: unknown) => {
			if (!cancelled) console.error("Basemap sync failed:", err);
		});

		return () => {
			cancelled = true;
			map.off("styledata", keepOrderStable);
		};
	}, [map, basemapId]);
}

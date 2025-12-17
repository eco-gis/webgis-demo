"use client";

import type { Map as MaplibreMap } from "maplibre-gl";

const DEFAULT_BASEMAP_LABEL_ANCHORS = [
	"road-label",
	"place-label",
	"poi-label",
	"transit-label",
	"settlement-subdivision-label",
	"settlement-label",
	"waterway-label",
] as const;

function findFirstExistingLayer(
	map: MaplibreMap,
	candidates: readonly string[],
): string | null {
	for (const id of candidates) {
		if (map.getLayer(id)) return id;
	}
	return null;
}

export function reorderAppLayers(map: MaplibreMap): void {
	const style = map.getStyle();
	if (!style || !style.layers) return;

	const labelAnchor = findFirstExistingLayer(
		map,
		DEFAULT_BASEMAP_LABEL_ANCHORS,
	);

	// Wir sortieren alle Layer, die mit diesen Präfixen beginnen
	const appLayerPrefixes = ["dummy-", "wms-", "draw-", "search-marker"];

	const layers = style.layers;
	for (const layer of layers) {
		const isAppLayer = appLayerPrefixes.some((pref) =>
			layer.id.startsWith(pref),
		);

		if (isAppLayer && labelAnchor && map.getLayer(layer.id)) {
			// Standard: Unter die Labels der Basemap
			map.moveLayer(layer.id, labelAnchor);
		}
	}

	// SPEZIALFALL: Drawing & Suche IMMER ganz nach oben (über alles andere)
	for (const layer of layers) {
		if (layer.id.startsWith("draw-") || layer.id.startsWith("search-marker")) {
			map.moveLayer(layer.id);
		}
	}
}
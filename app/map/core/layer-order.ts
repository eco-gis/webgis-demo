// app/map/core/layer-order.ts
"use client";

import type { Map as MaplibreMap, StyleSpecification } from "maplibre-gl";

const APP_LAYER_PREFIXES = ["wms-", "waldkauz-"] as const;
const TOP_LAYER_PREFIXES = ["draw-", "search-marker"] as const;

function findLabelAnchorId(style: StyleSpecification): string | null {
	const layers = style.layers;
	if (!layers) return null;

	// Prefer known label groups (MapTiler styles)
	const known = layers.find((l) => l.id === "Road labels" || l.id === "Transportation labels");
	if (known) return known.id;

	// Fallback: first symbol layer (but not contours)
	const fallback = layers.find((l) => l.type === "symbol" && !l.id.toLowerCase().includes("contour"));
	return fallback?.id ?? null;
}

function isPrefixed(id: string, prefixes: readonly string[]): boolean {
	for (const p of prefixes) if (id.startsWith(p)) return true;
	return false;
}

export function reorderAppLayers(map: MaplibreMap): void {
	const style = map.getStyle();
	if (!style?.layers) return;

	const labelAnchorId = findLabelAnchorId(style);

	if (labelAnchorId && map.getLayer(labelAnchorId)) {
		// 1) Move app overlays below labels (so labels stay readable)
		for (const l of style.layers) {
			if (!isPrefixed(l.id, APP_LAYER_PREFIXES)) continue;
			if (!map.getLayer(l.id)) continue;
			map.moveLayer(l.id, labelAnchorId);
		}
	}

	// 2) Ensure draw + search marker layers are on very top
	for (const l of style.layers) {
		if (!isPrefixed(l.id, TOP_LAYER_PREFIXES)) continue;
		if (!map.getLayer(l.id)) continue;
		map.moveLayer(l.id);
	}
}

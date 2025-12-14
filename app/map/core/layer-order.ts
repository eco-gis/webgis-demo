"use client";

import type maplibregl from "maplibre-gl";
import type { LayerSpecification } from "maplibre-gl";

type RankedLayer = {
	id: string;
	type: LayerSpecification["type"];
	index: number;
	rank: number;
};

function typeRank(t: LayerSpecification["type"]): number {
	// niedriger Rank = weiter unten; höher Rank = weiter oben
	// => Wir bewegen in Rank-Reihenfolge nach oben (labels zuletzt => ganz oben)
	switch (t) {
		case "fill":
		case "fill-extrusion":
		case "raster":
		case "background":
		case "hillshade":
		case "heatmap":
			return 0;

		case "line":
			return 1;

		case "circle":
			return 2;

		case "symbol":
			return 3;

		default:
			return 0;
	}
}

/**
 * Moves custom layers to the very top with a strict visual order:
 * symbol (text) > circle (points) > line > fill (polygons)
 *
 * Important: map.moveLayer(id) without beforeId puts layer on top.
 * Therefore we move lower-ranked layers first, higher-ranked layers last.
 */
export function moveCustomLayersToTopOrdered(
	map: maplibregl.Map,
	prefixes: readonly string[],
): void {
	const style = map.getStyle();
	const layers = style?.layers ?? [];
	if (layers.length === 0) return;

	const ranked: RankedLayer[] = [];

	for (let i = 0; i < layers.length; i++) {
		const l = layers[i];
		if (!map.getLayer(l.id)) continue;

		const isCustom = prefixes.some((p) => l.id.startsWith(p));
		if (!isCustom) continue;

		ranked.push({
			id: l.id,
			type: l.type,
			index: i,
			rank: typeRank(l.type),
		});
	}

	// stable sort: first by rank (low->high), then by original index
	ranked.sort((a, b) => (a.rank - b.rank) || (a.index - b.index));

	// Move in that order:
	// polygons first, then lines, then points, labels last => labels end up on top
	for (const l of ranked) {
		map.moveLayer(l.id);
	}
}

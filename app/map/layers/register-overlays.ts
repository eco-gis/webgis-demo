// app/map/layers/register-overlays.ts

import type { LayerSpecification, Map as MaplibreMap } from "maplibre-gl";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

function layerRank(layer: LayerSpecification): number {
	// klein = weiter unten
	switch (layer.type) {
		case "fill":
			return 10; // Polygon
		case "line":
			return 20; // Linie
		case "circle":
			return 30; // Punkt
		case "symbol":
			return 40; // Text
		default:
			return 25;
	}
}

export function registerOverlays(
	map: MaplibreMap,
	def: OverlayDefinition,
): void {
	for (const [id, source] of Object.entries(def.sources)) {
		if (!map.getSource(id)) map.addSource(id, source);
	}

	const ordered = [...def.layers].sort((a, b) => layerRank(a) - layerRank(b));

	for (const layer of ordered) {
		if (!map.getLayer(layer.id)) map.addLayer(layer);
	}
}

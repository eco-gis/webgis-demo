// app/map/layers/register-overlays.ts

import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";
import type { Map as MaplibreMap } from "maplibre-gl";
import { reorderAppLayers } from "../core/layer-order"; // Importieren

export function registerOverlays(
	map: MaplibreMap,
	def: OverlayDefinition,
): void {
	for (const [id, source] of Object.entries(def.sources)) {
		if (!map.getSource(id)) map.addSource(id, source);
	}
	for (const layer of def.layers) {
		if (!map.getLayer(layer.id)) {
			map.addLayer(layer);
		}
	}
	reorderAppLayers(map);
}

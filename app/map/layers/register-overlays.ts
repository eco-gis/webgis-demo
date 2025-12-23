// app/map/layers/register-overlays.ts

import type { Map as MaplibreMap } from "maplibre-gl";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";
import { reorderAppLayers } from "../core/layer-order";

export function registerOverlays(map: MaplibreMap, def: OverlayDefinition): void {
	for (const [id, source] of Object.entries(def.sources)) {
		if (!map.getSource(id)) map.addSource(id, source);
	}
	for (const layer of def.layers) {
		if (!map.getLayer(layer.id)) map.addLayer(layer);
	}
	reorderAppLayers(map);
}

export function unregisterOverlays(map: MaplibreMap, def: OverlayDefinition): void {
	// Layer in umgekehrter Reihenfolge entfernen (oben -> unten), ist robuster
	for (const layer of [...def.layers].reverse()) {
		if (map.getLayer(layer.id)) {
			map.removeLayer(layer.id);
		}
	}

	// Danach Sources entfernen
	for (const id of Object.keys(def.sources)) {
		if (map.getSource(id)) {
			map.removeSource(id);
		}
	}

	reorderAppLayers(map);
}

// app/map/core/layer-order.ts
"use client";

import type { Map as MaplibreMap } from "maplibre-gl";

export function reorderAppLayers(map: MaplibreMap): void {
    const style = map.getStyle();
				if (!style?.layers) return;

				const labelAnchor = style.layers.find(
					(l) =>
						l.id === "Road labels" ||
						l.id === "Transportation labels" ||
						(l.type === "symbol" && !l.id.toLowerCase().includes("contour")),
				)?.id;

				const appLayerPrefixes = ["dummy-", "wms-", "habitats-"];
				const appLayers = style.layers.filter((l) =>
					appLayerPrefixes.some((pref) => l.id.startsWith(pref)),
				);

				for (const layer of appLayers) {
					if (labelAnchor && map.getLayer(layer.id)) {
						map.moveLayer(layer.id, labelAnchor);
					}
				}

				const topLayers = ["draw-", "search-marker"];
				for (const layer of style.layers) {
					if (
						topLayers.some((pref) => layer.id.startsWith(pref)) &&
						map.getLayer(layer.id)
					) {
						map.moveLayer(layer.id);
					}
				}
}
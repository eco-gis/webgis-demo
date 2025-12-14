"use client";

import type { LayerSpecification, Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";
import { useTocStore } from "./toc-store";
import type { TocItemConfig } from "./toc-types";

function setLayerVisibility(
	map: MapLibreMap,
	layerId: string,
	visible: boolean,
): void {
	if (!map.getLayer(layerId)) return;
	map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

function opacityPaintProp(layer: LayerSpecification): string | null {
	if (layer.type === "fill") return "fill-opacity";
	if (layer.type === "line") return "line-opacity";
	if (layer.type === "circle") return "circle-opacity";
	if (layer.type === "symbol") return "text-opacity";
	return null;
}

function setLayerOpacity(
	map: MapLibreMap,
	layerId: string,
	value01: number,
): void {
	const layer = map.getLayer(layerId) as LayerSpecification | undefined;
	if (!layer) return;

	const prop = opacityPaintProp(layer);
	if (!prop) return;

	map.setPaintProperty(layerId, prop, value01);
}

export function useTocSync(
	map: MapLibreMap | null,
	items: readonly TocItemConfig[],
): void {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const initFromItems = useTocStore((s) => s.initFromItems);

	// Defaults (und neue IDs) in den Store übernehmen
	useEffect(() => {
		if (!items.length) return;
		initFromItems(items);
	}, [items, initFromItems]);

	useEffect(() => {
		if (!map) return;

		for (const item of items) {
			const isOn = visible[item.id] ?? item.defaultVisible;
			const labelsOn = labelsVisible[item.id] ?? item.defaultLabelsVisible;
			const op = opacity[item.id] ?? item.defaultOpacity;

			for (const lid of item.layerIds) {
				setLayerVisibility(map, lid, isOn);
				setLayerOpacity(map, lid, op);
			}

			for (const lid of item.labelLayerIds) {
				setLayerVisibility(map, lid, isOn && labelsOn);
			}
		}
	}, [map, items, visible, labelsVisible, opacity]);
}

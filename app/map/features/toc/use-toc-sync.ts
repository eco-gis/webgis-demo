"use client";

import { reorderAppLayers } from "@/app/map/core/layer-order";
import type { Map as MapLibreMap, StyleLayer } from "maplibre-gl";
import { useEffect, useMemo } from "react";
import { useTocStore } from "./toc-store";
import type { TocItemConfig, TocItemId } from "./toc-types";

function opacityPaintPropByType(type: StyleLayer["type"]): string | null {
	switch (type) {
		case "fill":
			return "fill-opacity";
		case "line":
			return "line-opacity";
		case "circle":
			return "circle-opacity";
		case "symbol":
			return "text-opacity";
		case "raster":
			return "raster-opacity";
		default:
			return null;
	}
}

function asStringArray(v: unknown): string[] {
	return Array.isArray(v)
		? v.filter((x): x is string => typeof x === "string")
		: [];
}

function buildOrderedItems(
	items: readonly TocItemConfig[],
	order: readonly TocItemId[],
): TocItemConfig[] {
	const byId = new Map<TocItemId, TocItemConfig>();
	for (const it of items) byId.set(it.id, it);

	const out: TocItemConfig[] = [];
	// Zuerst nach der definierten 'order' gehen
	for (const id of order) {
		const it = byId.get(id);
		if (it) out.push(it);
	}
	// Fehlende Items (die nicht in order sind) hinten anfügen
	for (const it of items) {
		if (!out.some((o) => o.id === it.id)) out.push(it);
	}
	return out;
}

export function useTocSync(
	map: MapLibreMap | null,
	items: readonly TocItemConfig[],
): void {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const order = useTocStore((s) => s.order);
	const initFromItems = useTocStore((s) => s.initFromItems);

	useEffect(() => {
		if (items.length) initFromItems(items);
	}, [items, initFromItems]);

	const orderedItems = useMemo(
		() => buildOrderedItems(items, order),
		[items, order],
	);

	// Z-ORDER SYNC
	useEffect(() => {
		if (!map) return;

		// 1. Grundschichtung herstellen (Basemap unten, App oben)
		reorderAppLayers(map);

		// 2. TOC-Sortierung anwenden
		// Da moveLayer(id) den Layer an das Ende des Stacks (nach oben) schiebt,
		// müssen wir orderedItems von UNTEN NACH OBEN durchlaufen.
		const itemsToMove = [...orderedItems].reverse();

		for (const item of itemsToMove) {
			// Erst Flächen/Linien
			for (const lid of asStringArray(item.mapLayerIds)) {
				if (map.getLayer(lid)) map.moveLayer(lid);
			}
			// Dann Labels (damit Labels innerhalb eines Items über der Fläche liegen)
			for (const lid of asStringArray(item.labelLayerIds)) {
				if (map.getLayer(lid)) map.moveLayer(lid);
			}
		}

		// 3. System-Layer (Draw/Search) nochmals final nach ganz oben
		const layers = map.getStyle()?.layers || [];
		for (const l of layers) {
			if (l.id.startsWith("draw-") || l.id.startsWith("search-marker")) {
				map.moveLayer(l.id);
			}
		}
	}, [map, orderedItems]);

	// VISIBILITY & OPACITY SYNC
	useEffect(() => {
		if (!map) return;

		for (const item of orderedItems) {
			const isOn = visible[item.id] ?? true;
			const labelsOn = labelsVisible[item.id] ?? false;
			const op = opacity[item.id] ?? 1;

			const allLayerIds = [
				...asStringArray(item.mapLayerIds),
				...asStringArray(item.labelLayerIds),
			];

			for (const lid of allLayerIds) {
				const layer = map.getLayer(lid);
				if (!layer) continue;

				const isLabelLayer = asStringArray(item.labelLayerIds).includes(lid);
				const shouldBeVisible = isLabelLayer ? isOn && labelsOn : isOn;

				map.setLayoutProperty(
					lid,
					"visibility",
					shouldBeVisible ? "visible" : "none",
				);

				const prop = opacityPaintPropByType(layer.type);
				if (prop) map.setPaintProperty(lid, prop, op);
			}
		}
	}, [map, orderedItems, visible, labelsVisible, opacity]);
}

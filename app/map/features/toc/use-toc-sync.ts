"use client";

import type { Map as MapLibreMap, StyleLayer } from "maplibre-gl";
import { useCallback, useEffect, useMemo } from "react";
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

	const orderedItems = useMemo(() => {
		const byId = new Map<TocItemId, TocItemConfig>();
		for (const it of items) byId.set(it.id, it);
		const out: TocItemConfig[] = [];
		for (const id of order) {
			const it = byId.get(id);
			if (it) out.push(it);
		}
		for (const it of items) {
			if (!out.some((o) => o.id === it.id)) out.push(it);
		}
		return out;
	}, [items, order]);

	const applyZOrder = useCallback(() => {
		if (!map || !map.isStyleLoaded()) return;

		// 1. TOC-Layer sortieren (von hinten nach vorne)
		const itemsToMove = [...orderedItems].reverse();
		for (const item of itemsToMove) {
			const allIds = [
				...asStringArray(item.mapLayerIds),
				...asStringArray(item.labelLayerIds),
			];
			for (const lid of allIds) {
				if (map.getLayer(lid)) {
					map.moveLayer(lid);
				}
			}
		}

		// 2. System-Layer (Search/Draw) IMMER ganz nach oben
		// WICHTIG: Immer prüfen, ob der Layer existiert!
		if (map.getLayer("search-marker-layer")) {
			map.moveLayer("search-marker-layer");
		}

		const layers = map.getStyle()?.layers || [];
		for (const l of layers) {
			// Drawing-Layer nach ganz oben schieben
			if (l.id.startsWith("draw-") || l.id.includes("gl-draw")) {
				map.moveLayer(l.id);
			}
		}
	}, [map, orderedItems]);

	useEffect(() => {
		if (!map) return;

		// 'styledata' ist essenziell nach setStyle()
		map.on("styledata", applyZOrder);
		// 'idle' hilft, wenn alles fertig gerendert ist
		map.on("idle", applyZOrder);

		applyZOrder();

		return () => {
			map.off("styledata", applyZOrder);
			map.off("idle", applyZOrder);
		};
	}, [map, applyZOrder]);

	// Visibility & Opacity
	useEffect(() => {
		if (!map) return;

		// Wir nutzen styledata um sicherzustellen, dass die Properties
		// auch nach Style-Wechsel greifen
		const syncProperties = () => {
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
		};

		syncProperties();
		map.on("styledata", syncProperties);
		return () => {
			map.off("styledata", syncProperties);
		};
	}, [map, orderedItems, visible, labelsVisible, opacity]);
}
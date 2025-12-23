// app/map/toc/use-toc-sync.ts
"use client";

import type { Map as MapLibreMap, StyleLayer } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTocStore } from "./toc-store";
import type { TocItemConfig, TocItemId } from "./toc-types";

// ============================================================================
// Helper Functions
// ============================================================================

function opacityPaintPropByType(type: StyleLayer["type"]): string | null {
	switch (type) {
		case "fill":
			return "fill-opacity";
		case "line":
			return "line-opacity";
		case "circle":
			return "circle-opacity";
		case "raster":
			return "raster-opacity";
		case "background":
			return "background-opacity";
		default:
			return null;
	}
}

function asStringArray(v: unknown): string[] {
	return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function uniqStrings(ids: readonly string[]): string[] {
	const out: string[] = [];
	const seen = new Set<string>();
	for (const id of ids) {
		if (!seen.has(id)) {
			seen.add(id);
			out.push(id);
		}
	}
	return out;
}

function moveToTopIfExists(map: MapLibreMap, layerId: string): void {
	if (map.getLayer(layerId)) map.moveLayer(layerId);
}

// ============================================================================
// Hook
// ============================================================================

export function useTocSync(map: MapLibreMap | null, items: readonly TocItemConfig[]): void {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const order = useTocStore((s) => s.order);
	const initFromItems = useTocStore((s) => s.initFromItems);

	// ---------- Init Store ----------
	useEffect(() => {
		if (items.length) initFromItems(items);
	}, [items, initFromItems]);

	// ---------- Compute Ordered Items ----------
	const orderedItems = useMemo(() => {
		const byId = new Map<TocItemId, TocItemConfig>();
		for (const it of items) byId.set(it.id, it);

		const out: TocItemConfig[] = [];
		const seen = new Set<TocItemId>();

		for (const id of order) {
			const it = byId.get(id);
			if (it) {
				out.push(it);
				seen.add(id);
			}
		}

		for (const it of items) {
			if (!seen.has(it.id)) out.push(it);
		}

		return out;
	}, [items, order]);

	// Keep latest store snapshots without re-registering map listeners constantly
	const orderedItemsRef = useRef(orderedItems);
	const visibleRef = useRef(visible);
	const labelsVisibleRef = useRef(labelsVisible);
	const opacityRef = useRef(opacity);

	useEffect(() => {
		orderedItemsRef.current = orderedItems;
	}, [orderedItems]);
	useEffect(() => {
		visibleRef.current = visible;
	}, [visible]);
	useEffect(() => {
		labelsVisibleRef.current = labelsVisible;
	}, [labelsVisible]);
	useEffect(() => {
		opacityRef.current = opacity;
	}, [opacity]);

	// ---------- Z-Order Management ----------
	const applyZOrder = useCallback(() => {
		const m = map;
		if (!m || !m.isStyleLoaded()) return;

		// Move in reverse order so first items end up below later ones
		const itemsToMove = [...orderedItemsRef.current].reverse();

		for (const item of itemsToMove) {
			const ids = uniqStrings([...asStringArray(item.mapLayerIds), ...asStringArray(item.labelLayerIds)]);

			for (const id of ids) {
				if (m.getLayer(id)) m.moveLayer(id);
			}
		}

		// Keep UI layers on top
		moveToTopIfExists(m, "search-marker-layer");

		for (const l of m.getStyle()?.layers ?? []) {
			const id = l.id;
			if (id.startsWith("draw-") || id.includes("gl-draw")) {
				moveToTopIfExists(m, id);
			}
		}
	}, [map]);

	useEffect(() => {
		const m = map;
		if (!m) return;

		m.on("style.load", applyZOrder);
		m.on("app.style.ready", applyZOrder);
		m.on("idle", applyZOrder);

		applyZOrder();

		return () => {
			m.off("style.load", applyZOrder);
			m.off("app.style.ready", applyZOrder);
			m.off("idle", applyZOrder);
		};
	}, [map, applyZOrder]);

	// ---------- Visibility & Opacity Sync ----------
	const syncProperties = useCallback(() => {
		const m = map;
		if (!m || !m.isStyleLoaded()) return;

		const ordered = orderedItemsRef.current;
		const v = visibleRef.current;
		const lv = labelsVisibleRef.current;
		const opMap = opacityRef.current;

		for (const item of ordered) {
			const isOn = v[item.id] ?? true;
			const labelsOn = lv[item.id] ?? false;
			const op = opMap[item.id] ?? 1;

			const mapIds = asStringArray(item.mapLayerIds);
			const labelIds = asStringArray(item.labelLayerIds);
			const labelSet = new Set(labelIds);

			const allIds = uniqStrings([...mapIds, ...labelIds]);

			for (const id of allIds) {
				const layer = m.getLayer(id);
				if (!layer) continue;

				const isLabel = labelSet.has(id);
				const shouldBeVisible = isLabel ? isOn && labelsOn : isOn;

				m.setLayoutProperty(id, "visibility", shouldBeVisible ? "visible" : "none");

				if (layer.type === "symbol") {
					// text/icon may not exist on all symbol layers, but setPaintProperty is fine
					m.setPaintProperty(id, "text-opacity", op);
					m.setPaintProperty(id, "icon-opacity", op);
				} else {
					const prop = opacityPaintPropByType(layer.type);
					if (prop) m.setPaintProperty(id, prop, op);
				}
			}
		}
	}, [map]);

	useEffect(() => {
		const m = map;
		if (!m) return;

		// Re-sync whenever style changes or overlays are restored
		m.on("style.load", syncProperties);
		m.on("app.style.ready", syncProperties);

		// Initial sync
		syncProperties();

		return () => {
			m.off("style.load", syncProperties);
			m.off("app.style.ready", syncProperties);
		};
	}, [map, syncProperties]);

	// Also re-sync immediately when store state changes (no listener rebinds)
	useEffect(() => {
		if (!map) return;
		syncProperties();
	}, [map, syncProperties]);
}

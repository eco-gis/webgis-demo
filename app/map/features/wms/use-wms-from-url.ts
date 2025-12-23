// app/map/features/wms/use-wms-from-url.ts
"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useCallback, useEffect, useRef } from "react";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import { parseWmsFromSearch, toTocItem } from "./wms-from-url";
import { upsertWmsLayer } from "./wms-maplibre";

export function useWmsFromUrl(map: MapLibreMap | null): void {
	const lastKeyRef = useRef<string | null>(null);

	const syncWms = useCallback(() => {
		const m = map;
		if (!m) return;
		if (typeof window === "undefined") return;
		if (!m.isStyleLoaded()) return;

		const cfg = parseWmsFromSearch(window.location.search);
		if (!cfg) return;

		// prevent busy re-upserts on repeated events if URL didn't change
		const key = JSON.stringify({
			id: cfg.id,
			baseUrl: cfg.baseUrl,
			layers: cfg.layers,
			format: cfg.format,
			transparent: cfg.transparent,
			opacity: cfg.opacity ?? null,
			title: cfg.title,
		});
		if (lastKeyRef.current === key) return;
		lastKeyRef.current = key;

		const state = useTocStore.getState();
		const existingOpacity = state.opacity[cfg.id];
		const isVisible = state.visible[cfg.id] ?? true;

		const activeCfg = {
			...cfg,
			opacity: existingOpacity ?? cfg.opacity ?? 1,
		};

		// 1) add/update map layer
		upsertWmsLayer(m, activeCfg);

		if (m.getLayer(activeCfg.id)) {
			// 2) enforce visibility (upsert might not)
			m.setLayoutProperty(activeCfg.id, "visibility", isVisible ? "visible" : "none");
		}

		// 3) register in TOC store
		state.registerDynamicItem(toTocItem(activeCfg));
	}, [map]);

	useEffect(() => {
		const m = map;
		if (!m) return;

		// reset cache when map instance changes
		lastKeyRef.current = null;

		const onReady = () => syncWms();

		m.on("app.style.ready", onReady);
		m.on("style.load", onReady);

		// initial
		syncWms();

		return () => {
			m.off("app.style.ready", onReady);
			m.off("style.load", onReady);
		};
	}, [map, syncWms]);
}

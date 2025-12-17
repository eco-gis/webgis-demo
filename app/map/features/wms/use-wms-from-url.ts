// app/map/features/wms/use-wms-from-url.ts
"use client";

import { useTocStore } from "@/app/map/features/toc/toc-store";
import type maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { parseWmsFromSearch, toTocItem } from "./wms-from-url";
import { upsertWmsLayer } from "./wms-maplibre";

export function useWmsFromUrl(map: maplibregl.Map | null): void {
	useEffect(() => {
		if (!map) return;

		const cfg = parseWmsFromSearch(window.location.search);
		if (!cfg) return;

		upsertWmsLayer(map, cfg);
		useTocStore.getState().registerDynamicItem(toTocItem(cfg));
	}, [map]);
}

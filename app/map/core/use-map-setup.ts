// app/map/core/use-map-setup.ts
"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";
import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";

function performSetup(map: MapLibreMap): void {
	if (!map.isStyleLoaded()) return;
	ensureSearchMarkerLayer(map);
	map.fire("app.layers.ready");
}

export function useMapSetup(map: MapLibreMap | null): void {
	useEffect(() => {
		if (!map) return;
		performSetup(map);
		const onAppStyleReady = () => {
			performSetup(map);
		};
		map.on("app.style.ready", onAppStyleReady);
		return () => {
			map.off("app.style.ready", onAppStyleReady);
		};
	}, [map]);
}

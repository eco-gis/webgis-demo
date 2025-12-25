// app/map/core/use-map-setup.ts
"use client";

import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";

function performSetup(map: MapLibreMap): void {
	if (!map.isStyleLoaded()) return;
	ensureSearchMarkerLayer(map);

	// 🔧 wichtig: das Event, auf das Features hören
	map.fire("app.layers.ready");

	// optional: Backwards-Compat, falls irgendwo noch "app.style.ready" genutzt wird
	map.fire("app.style.ready");
}

export function useMapSetup(map: MapLibreMap | null): void {
	useEffect(() => {
		if (!map) return;

		performSetup(map);

		const onAppStyleReady = () => performSetup(map);
		map.on("app.style.ready", onAppStyleReady);

		return () => {
			map.off("app.style.ready", onAppStyleReady);
		};
	}, [map]);
}

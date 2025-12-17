// app/map/core/use-map-setup.ts
"use client";

import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";

export function useMapSetup(map: MapLibreMap | null) {
	useEffect(() => {
		if (!map) return;

		const setup = () => {
			// registerOverlays hier ENTFERNT, da useMapLibre das übernimmt
			ensureSearchMarkerLayer(map);
		};

		if (map.isStyleLoaded()) setup();
		else map.once("load", setup);

		map.on("style.load", setup);
		return () => {
			map.off("style.load", setup);
		};
	}, [map]);
}

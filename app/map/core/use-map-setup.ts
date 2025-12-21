// app/map/core/use-map-setup.ts
"use client";

import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";

export function useMapSetup(map: MapLibreMap | null): void {
	useEffect(() => {
		if (!map) return;

		const setup = () => {
			if (!map.isStyleLoaded()) return;

			console.log("🔧 Running map setup");

			// Nur Search marker - Overlays werden in use-basemap-sync hinzugefügt
			ensureSearchMarkerLayer(map);

			// Event für andere Features (WMS, etc.)
			map.fire("app.layers.ready");

			console.log("✅ Map setup complete");
		};

		// Initial setup
		setup();

		// Bei Style-Änderungen
		map.on("style.load", setup);
		map.on("basemap.ready", setup);

		return () => {
			map.off("style.load", setup);
			map.off("basemap.ready", setup);
		};
	}, [map]);
}

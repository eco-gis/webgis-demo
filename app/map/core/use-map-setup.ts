"use client";

import { MAP_CONFIG } from "@/app/map/config/map-config";
import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";
import { registerOverlays } from "@/app/map/layers/register-overlays";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect } from "react";

export function useMapSetup(map: MapLibreMap | null) {
	useEffect(() => {
		if (!map) return;

		const setup = () => {
			// 1. Alle statischen Overlays registrieren
			registerOverlays(map, MAP_CONFIG.overlays);

			// 2. Such-Marker Layer sicherstellen
			ensureSearchMarkerLayer(map);
		};

		// Initiales Setup
		if (map.isStyleLoaded()) {
			setup();
		} else {
			map.once("load", setup);
		}

		// Der entscheidende Teil: Re-Initialisierung nach Style-Wechsel
		map.on("style.load", setup);

		return () => {
			map.off("style.load", setup);
		};
	}, [map]);
}

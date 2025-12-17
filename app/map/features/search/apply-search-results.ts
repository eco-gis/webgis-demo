import type { GeocodingFeature } from "@/app/lib/maptiler/geocoding";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { SEARCH_MARKER_SOURCE_ID } from "./search-marker";

/**
 * Zentriert die Karte auf das Ergebnis und setzt den Marker
 */
export function applySearchResult(map: MapLibreMap, f: GeocodingFeature) {
	const [lng, lat] = f.center;

	map.flyTo({
		center: [lng, lat],
		zoom: 15,
		essential: true,
		padding: { top: 50, bottom: 50, left: 50, right: 50 },
	});

	const source = map.getSource(SEARCH_MARKER_SOURCE_ID) as
		| GeoJSONSource
		| undefined;

	if (source && typeof source.setData === "function") {
		source.setData({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [lng, lat] },
					properties: { place_name: f.place_name, id: f.id },
				},
			],
		});
	}
}

/**
 * Entfernt den Suchmarker von der Karte
 */
export function clearSearchMarker(map: MapLibreMap) {
	const source = map.getSource(SEARCH_MARKER_SOURCE_ID) as
		| GeoJSONSource
		| undefined;
	if (source && typeof source.setData === "function") {
		source.setData({
			type: "FeatureCollection",
			features: [],
		});
	}
}

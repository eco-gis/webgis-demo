import type { GeocodingFeature } from "@/app/lib/maptiler/geocoding";
import type { Map as MapLibreMap } from "maplibre-gl";
import { SEARCH_MARKER_SOURCE_ID } from "./search-marker";

type GeoJSONPoint = {
	type: "FeatureCollection";
	features: Array<{
		type: "Feature";
		geometry: { type: "Point"; coordinates: [number, number] };
		properties: Record<string, unknown>;
	}>;
};

export function applySearchResult(map: MapLibreMap, f: GeocodingFeature) {
	const [lng, lat] = f.center;

	// Fly
	map.flyTo({
		center: [lng, lat],
		zoom: 15,
		essential: true,
	});

	// Marker setzen
	const src = map.getSource(SEARCH_MARKER_SOURCE_ID);
	if (!src) return;

	const data: GeoJSONPoint = {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				geometry: { type: "Point", coordinates: [lng, lat] },
				properties: { place_name: f.place_name, id: f.id },
			},
		],
	};

	// MapLibre geojson-source: setData exists, aber nicht sauber typisiert
	// -> Typ-sicher über Narrowing auf unbekannt und check
	const s = src as unknown;
	if (
		typeof s === "object" &&
		s !== null &&
		"setData" in s &&
		typeof (s as { setData: (d: unknown) => void }).setData === "function"
	) {
		(s as { setData: (d: unknown) => void }).setData(data);
	}
}

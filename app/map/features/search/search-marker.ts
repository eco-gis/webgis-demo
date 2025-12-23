// app/map/features/search/search-marker.ts
import type { LayerSpecification, Map as MaplibreMap, SourceSpecification } from "maplibre-gl";

export const SEARCH_MARKER_SOURCE_ID = "search-marker";
const SEARCH_MARKER_LAYER_ID = "search-marker-layer";

const source: SourceSpecification = {
	type: "geojson",
	data: { type: "FeatureCollection", features: [] },
};

const layer: LayerSpecification = {
	id: SEARCH_MARKER_LAYER_ID,
	type: "circle",
	source: SEARCH_MARKER_SOURCE_ID,
	paint: {
		"circle-radius": 8,
		"circle-color": "#111827",
		"circle-stroke-width": 2,
		"circle-stroke-color": "#ffffff",
	},
};

const isStyleReady = (map: MaplibreMap): boolean => {
	// loaded() sagt nur: "map hat geladen", nicht dass ein neuer Style fertig ist
	// isStyleLoaded() ist gut, aber manchmal zu früh. idle ist am zuverlässigsten.
	return Boolean(map.loaded()) && Boolean(map.isStyleLoaded());
};

const ensureNow = (map: MaplibreMap) => {
	if (!map.getSource(SEARCH_MARKER_SOURCE_ID)) {
		map.addSource(SEARCH_MARKER_SOURCE_ID, source);
	}
	if (!map.getLayer(SEARCH_MARKER_LAYER_ID)) {
		map.addLayer(layer);
	}
};

export function ensureSearchMarkerLayer(map: MaplibreMap) {
	// Wenn der Style wirklich ready ist: sofort
	if (isStyleReady(map)) {
		ensureNow(map);
		return;
	}

	// Sonst: einmalig warten bis idle (style fertig geladen + render pipeline idle)
	const onIdle = () => {
		// defensive: listener entfernen
		map.off("idle", onIdle);

		// style könnte inzwischen erneut gewechselt haben -> nochmal prüfen
		if (!isStyleReady(map)) return;

		ensureNow(map);
	};

	// wichtig: nicht mehrfach registrieren (wenn ensure oft aufgerufen wird)
	map.off("idle", onIdle);
	map.on("idle", onIdle);
}

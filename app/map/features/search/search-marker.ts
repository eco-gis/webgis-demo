import type { LayerSpecification, Map as MaplibreMap, SourceSpecification } from "maplibre-gl";

export const SEARCH_MARKER_SOURCE_ID = "search-marker";

const source: SourceSpecification = {
	type: "geojson",
	data: {
		type: "FeatureCollection",
		features: [],
	},
};

const layer: LayerSpecification = {
	id: "search-marker-layer",
	type: "circle",
	source: SEARCH_MARKER_SOURCE_ID,
	paint: {
		"circle-radius": 8,
		"circle-color": "#111827",
		"circle-stroke-width": 2,
		"circle-stroke-color": "#ffffff",
	},
};

export function ensureSearchMarkerLayer(map: MaplibreMap) {
	if (!map.getSource(SEARCH_MARKER_SOURCE_ID)) {
		map.addSource(SEARCH_MARKER_SOURCE_ID, source);
	}
	if (!map.getLayer(layer.id)) {
		map.addLayer(layer);
	}
}

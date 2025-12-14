import type { LayerSpecification, SourceSpecification } from "maplibre-gl";

export const DRAW_DATA_SOURCE_ID = "draw-data";
export const DRAW_SKETCH_SOURCE_ID = "draw-sketch";

const EMPTY_FC: GeoJSON.FeatureCollection = {
	type: "FeatureCollection",
	features: [],
};

export const DRAW_SOURCES: Record<string, SourceSpecification> = {
	[DRAW_DATA_SOURCE_ID]: {
		type: "geojson",
		data: EMPTY_FC,
	},
	[DRAW_SKETCH_SOURCE_ID]: {
		type: "geojson",
		data: EMPTY_FC,
	},
};

export const DRAW_LAYERS: readonly LayerSpecification[] = [
	// Polygone
	{
		id: "draw-polygons-fill",
		type: "fill",
		source: DRAW_DATA_SOURCE_ID,
		filter: ["==", ["get", "kind"], "polygon"],
		paint: {
			"fill-color": "#3b82f6",
			"fill-opacity": 0.25,
		},
	},
	{
		id: "draw-polygons-outline",
		type: "line",
		source: DRAW_DATA_SOURCE_ID,
		filter: ["==", ["get", "kind"], "polygon"],
		paint: {
			"line-color": "#1d4ed8",
			"line-width": 2,
		},
	},

	// Linien + Pfeile (Linie)
	{
		id: "draw-lines",
		type: "line",
		source: DRAW_DATA_SOURCE_ID,
		filter: [
			"any",
			["==", ["get", "kind"], "line"],
			["==", ["get", "kind"], "arrow"],
		],
		paint: {
			"line-color": "#16a34a",
			"line-width": 3,
		},
	},

	// Punkte
	{
		id: "draw-points",
		type: "circle",
		source: DRAW_DATA_SOURCE_ID,
		filter: ["==", ["get", "kind"], "point"],
		paint: {
			"circle-radius": 6,
			"circle-color": "#dc2626",
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 2,
		},
	},

	// Punkt Labels
	{
		id: "draw-point-labels",
		type: "symbol",
		source: DRAW_DATA_SOURCE_ID,
		filter: ["==", ["get", "kind"], "point"],
		layout: {
			"text-field": ["coalesce", ["get", "label"], ""],
			"text-size": 14,
			"text-offset": [0, 1.2],
			"text-anchor": "top",
		},
		paint: {
			"text-color": "#111827",

			// ➜ weisser Buffer / Halo
			"text-halo-color": "#ffffff",
			"text-halo-width": 2,
			"text-halo-blur": 0.5,
		},
	},

	// Sketch Preview (Linie / Polygon Preview als Linie)
	{
		id: "draw-sketch-line",
		type: "line",
		source: DRAW_SKETCH_SOURCE_ID,
		paint: {
			"line-color": "#2563eb",
			"line-width": 2,
			"line-dasharray": [2, 2],
		},
	},
] as const;

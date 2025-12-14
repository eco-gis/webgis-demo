// app/map/layers/dummy-layers.ts

import type { LayerSpecification } from "maplibre-gl";
import { DUMMY_POINTS_SOURCE_ID, DUMMY_SOURCE_ID } from "./dummy-sources";

export const DUMMY_LAYERS_ALL: LayerSpecification[] = [
	// -------------------------
	// Polygone (PMTiles)
	// -------------------------
	{
		id: "dummy-polygons-fill",
		type: "fill",
		source: DUMMY_SOURCE_ID,
		"source-layer": "dummy_polygons",
		paint: {
			"fill-color": "#60a5fa",
			"fill-opacity": 0.3,
		},
	},
	{
		id: "dummy-polygons-outline",
		type: "line",
		source: DUMMY_SOURCE_ID,
		"source-layer": "dummy_polygons",
		paint: {
			"line-color": "#2563eb",
			"line-width": 2,
		},
	},
	{
		id: "dummy-polygons-label",
		type: "symbol",
		source: DUMMY_SOURCE_ID,
		"source-layer": "dummy_polygons",
		layout: {
			"text-field": ["get", "name"],
			"text-size": 12,
			"text-allow-overlap": true,
			"text-font": ["Noto Sans Regular", "Noto Sans Bold"],
		},
		paint: {
			"text-color": "#1e3a8a",
		},
	},

	// -------------------------
	// Linien (PMTiles)
	// -------------------------
	{
		id: "dummy-lines",
		type: "line",
		source: DUMMY_SOURCE_ID,
		"source-layer": "dummy_lines",
		paint: {
			"line-color": "#16a34a",
			"line-width": 3,
		},
	},
	{
		id: "dummy-lines-label",
		type: "symbol",
		source: DUMMY_SOURCE_ID,
		"source-layer": "dummy_lines",
		layout: {
			"symbol-placement": "line",
			"text-field": ["get", "name"],
			"text-size": 11,
			"text-allow-overlap": true,
			"text-font": ["Noto Sans Regular", "Noto Sans Bold"],
		},
		paint: {
			"text-color": "#065f46",
		},
	},

	// -------------------------
	// Punkte (GeoJSON + Cluster)
	// -------------------------

	// Cluster-Kreise
	{
		id: "dummy-points-clusters",
		type: "circle",
		source: DUMMY_POINTS_SOURCE_ID,
		filter: ["has", "point_count"],
		paint: {
			"circle-color": "#111827",
			"circle-opacity": 0.75,
			"circle-radius": [
				"step",
				["get", "point_count"],
				14, // < 10
				10,
				18, // >= 10
				50,
				24, // >= 50
				200,
				30, // >= 200
			],
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 2,
		},
	},

	// Cluster-Counts
	{
		id: "dummy-points-cluster-count",
		type: "symbol",
		source: DUMMY_POINTS_SOURCE_ID,
		filter: ["has", "point_count"],
		layout: {
			"text-field": ["to-string", ["get", "point_count"]],
			"text-size": 12,
			"text-font": ["Noto Sans Regular", "Noto Sans Bold"],
			"text-allow-overlap": true,
		},
		paint: {
			"text-color": "#ffffff",
		},
	},

	// Ungeclusterte Einzelpunkte
	{
		id: "dummy-points",
		type: "circle",
		source: DUMMY_POINTS_SOURCE_ID,
		filter: ["!", ["has", "point_count"]],
		paint: {
			"circle-radius": 6,
			"circle-color": [
				"match",
				["get", "category"],
				"A",
				"#dc2626",
				"B",
				"#ea580c",
				"#6b7280",
			],
			"circle-stroke-width": 1,
			"circle-stroke-color": "#ffffff",
		},
	},

	// Optional: Label für Einzelpunkte (nicht für Cluster)
	{
		id: "dummy-points-label",
		type: "symbol",
		source: DUMMY_POINTS_SOURCE_ID,
		filter: ["!", ["has", "point_count"]],
		layout: {
			"text-field": ["get", "name"],
			"text-offset": [0, 1.2],
			"text-size": 11,
			"text-allow-overlap": true,
			"text-font": ["Noto Sans Regular", "Noto Sans Bold"],
		},
		paint: {
			"text-color": "#111827",
		},
	},
] as const;

export const DUMMY_INTERACTIVE_LAYER_IDS = [
	"dummy-polygons-fill",
	"dummy-lines",
	"dummy-points",
	"dummy-points-clusters", // optional: Cluster klickbar machen
] as const;

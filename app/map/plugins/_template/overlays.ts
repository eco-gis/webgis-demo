// app/map/plugins/_template/overlays.ts

import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

/**
 * Source-IDs für Template-Plugin
 */
export const TEMPLATE_SOURCE_IDS = {
	points: "template-points-src",
	// polygons: "template-polygons-src",
} as const;

/**
 * Layer-IDs für Template-Plugin
 */
export const TEMPLATE_LAYER_IDS = {
	points: "template-points",
	// polygonsFill: "template-polygons-fill",
	// polygonsLine: "template-polygons-line",
} as const;

/**
 * GeoJSON Sources
 */
const sources: Record<string, SourceSpecification> = {
	[TEMPLATE_SOURCE_IDS.points]: {
		type: "geojson",
		data: "/data/plugins/template/points.geojson",
	},
};

/**
 * MapLibre Layers
 */
const pointsLayer: LayerSpecification = {
	id: TEMPLATE_LAYER_IDS.points,
	type: "circle",
	source: TEMPLATE_SOURCE_IDS.points,
	paint: {
		"circle-color": "#3b82f6", // Tailwind blue-500
		"circle-radius": 6,
		"circle-stroke-color": "#ffffff",
		"circle-stroke-width": 2,
	},
	metadata: { geoRole: "overlay" },
};

/**
 * Overlay-Definition
 */
export const templateOverlay: OverlayDefinition = {
	sources,
	layers: [pointsLayer],
};

// app/map/waldkauz/waldkauz-overlay.local.ts

import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

export const WALDKAUZ_SOURCE_IDS = {
	points: "waldkauz-points-src",
	buffer500: "waldkauz-buffer-500-src",
	buffer1000: "waldkauz-buffer-1000-src",
	buffer2000: "waldkauz-buffer-2000-src",
} as const;

export const WALDKAUZ_LAYER_IDS = {
	buffer2000Fill: "waldkauz-buffer-2000-fill",
	buffer2000Line: "waldkauz-buffer-2000-line",
	buffer1000Fill: "waldkauz-buffer-1000-fill",
	buffer1000Line: "waldkauz-buffer-1000-line",
	buffer500Fill: "waldkauz-buffer-500-fill",
	buffer500Line: "waldkauz-buffer-500-line",
	points: "waldkauz-points",
} as const;

const sources: Record<string, SourceSpecification> = {
	[WALDKAUZ_SOURCE_IDS.points]: { type: "geojson", data: "/data/waldkauz_location.geojson" },
	[WALDKAUZ_SOURCE_IDS.buffer500]: { type: "geojson", data: "/data/buffer_500.geojson" },
	[WALDKAUZ_SOURCE_IDS.buffer1000]: { type: "geojson", data: "/data/buffer_1000.geojson" },
	[WALDKAUZ_SOURCE_IDS.buffer2000]: { type: "geojson", data: "/data/buffer_2000.geojson" },
};

const bufferFill = (id: string, source: string, opacity: number): LayerSpecification => ({
	id,
	type: "fill",
	source,
	paint: {
		"fill-color": "#2563eb",
		"fill-opacity": opacity,
	},
	metadata: { geoRole: "overlay" },
});

const bufferLine = (id: string, source: string): LayerSpecification => ({
	id,
	type: "line",
	source,
	paint: {
		"line-color": "#1d4ed8",
		"line-width": 1,
		"line-opacity": 0.7,
	},
	metadata: { geoRole: "overlay" },
});

const pointsLayer: LayerSpecification = {
	id: WALDKAUZ_LAYER_IDS.points,
	type: "circle",
	source: WALDKAUZ_SOURCE_IDS.points,
	paint: {
		"circle-color": "#ef4444",
		"circle-radius": 6,
		"circle-stroke-color": "#ffffff",
		"circle-stroke-width": 2,
	},
	metadata: { geoRole: "overlay" },
};

export const waldkauzOverlayLocal: OverlayDefinition = {
	sources,
	layers: [
		bufferFill(WALDKAUZ_LAYER_IDS.buffer2000Fill, WALDKAUZ_SOURCE_IDS.buffer2000, 0.1),
		bufferLine(WALDKAUZ_LAYER_IDS.buffer2000Line, WALDKAUZ_SOURCE_IDS.buffer2000),

		bufferFill(WALDKAUZ_LAYER_IDS.buffer1000Fill, WALDKAUZ_SOURCE_IDS.buffer1000, 0.18),
		bufferLine(WALDKAUZ_LAYER_IDS.buffer1000Line, WALDKAUZ_SOURCE_IDS.buffer1000),

		bufferFill(WALDKAUZ_LAYER_IDS.buffer500Fill, WALDKAUZ_SOURCE_IDS.buffer500, 0.28),
		bufferLine(WALDKAUZ_LAYER_IDS.buffer500Line, WALDKAUZ_SOURCE_IDS.buffer500),

		pointsLayer,
	],
};

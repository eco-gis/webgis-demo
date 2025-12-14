// app/map/layers/dummy-sources.ts
import type { SourceSpecification } from "maplibre-gl";

export const DUMMY_SOURCE_ID = "dummy"; // PMTiles (lines + polygons)
export const DUMMY_POINTS_SOURCE_ID = "dummy-points"; // GeoJSON (clustered)

export const DUMMY_SOURCES: Record<string, SourceSpecification> = {
	// ✅ Linien + Polygone aus PMTiles
	[DUMMY_SOURCE_ID]: {
		type: "vector",
		tiles: ["pmtiles://./data/dummy.pmtiles/{z}/{x}/{y}"],
	},

	// ✅ Punkte als GeoJSON, damit MapLibre clustern kann
	[DUMMY_POINTS_SOURCE_ID]: {
		type: "geojson",
		data: "./data/dummy_point.geojson",
		cluster: true,
		clusterRadius: 40, // px (tweak)
		clusterMaxZoom: 16, // ab diesem Zoom keine Cluster mehr
	},
};

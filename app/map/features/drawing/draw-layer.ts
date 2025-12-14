import type { LayerSpecification, SourceSpecification } from "maplibre-gl";

export const DRAW_SOURCE_ID = "drawn-area" as const;
export const DRAW_LAYER_ID = "drawn-area-fill" as const;
export const DRAW_OUTLINE_LAYER_ID = "drawn-area-outline" as const;

export const DRAW_SOURCE: SourceSpecification = {
  type: "geojson",
  data: { type: "FeatureCollection", features: [] },
};

export const DRAW_LAYERS: LayerSpecification[] = [
  {
    id: DRAW_LAYER_ID,
    type: "fill",
    source: DRAW_SOURCE_ID,
    paint: {
      "fill-opacity": 0.25,
      "fill-color": "#3b82f6",
    },
  },
  {
    id: DRAW_OUTLINE_LAYER_ID,
    type: "line",
    source: DRAW_SOURCE_ID,
    paint: {
      "line-width": 2,
      "line-color": "#1d4ed8",
      "line-opacity": 0.9,
    },
  },
];

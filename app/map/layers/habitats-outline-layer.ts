// map/layers/habitats-outline-layer.ts
import type { LineLayerSpecification } from "maplibre-gl";

export const habitatsOutlineLayer: LineLayerSpecification = {
	id: "habitats-outline",
	type: "line",
	source: "habitats",
	paint: {
		"line-color": "#059669",
		"line-width": 1.5,
	},
};

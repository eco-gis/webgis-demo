// map/layers/habitats-fill-layer.ts
import type { FillLayerSpecification } from "maplibre-gl";

export const habitatsFillLayer: FillLayerSpecification = {
	id: "habitats-fill",
	type: "fill",
	source: "habitats",
	paint: {
		"fill-color": "#059669",
		"fill-opacity": 0.18,
	},
};

// app/map/demo/demo-toc-items.ts
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

export const DEMO_TOC_ITEMS: readonly TocItemConfig[] = [
	{
		id: "polygons",
		title: "Habitate",
		layerIds: ["dummy-polygons-fill", "dummy-polygons-outline"],
		labelLayerIds: ["dummy-polygons-label"],
		defaultVisible: true,
		defaultLabelsVisible: true,
		defaultOpacity: 0.3,
	},
	{
		id: "lines",
		title: "Fliessgewässer",
		layerIds: ["dummy-lines"],
		labelLayerIds: ["dummy-lines-label"],
		defaultVisible: true,
		defaultLabelsVisible: true,
		defaultOpacity: 1,
	},
	{
		id: "points",
		title: "Brutplätze",
		layerIds: ["dummy-points"],
		labelLayerIds: ["dummy-points-label"],
		defaultVisible: true,
		defaultLabelsVisible: true,
		defaultOpacity: 1,
	},
];

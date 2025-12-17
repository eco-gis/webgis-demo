// app/map/demo/demo-toc-items.ts
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

export const DEMO_TOC_ITEMS: readonly TocItemConfig[] = [
	{
		id: "points",
		title: "Brutplätze",
		mapLayerIds: [
			"dummy-points",
			"dummy-points-clusters",
			"dummy-points-cluster-count",
		],
		labelLayerIds: ["dummy-points-label"],
		defaultVisible: true,
		defaultLabelsVisible: true,
		defaultOpacity: 1,
	},
	{
		id: "lines",
		title: "Fliessgewässer",
		mapLayerIds: ["dummy-lines"],
		labelLayerIds: ["dummy-lines-label"],
		defaultVisible: true,
		defaultLabelsVisible: true,
		defaultOpacity: 1,
	},
	{
		id: "polygons",
		title: "Habitate",
		mapLayerIds: [
			"dummy-polygons",
			"dummy-polygons-fill",
			"dummy-polygons-outline",
		],
		labelLayerIds: ["dummy-polygons-label"],
		defaultVisible: true,
		defaultLabelsVisible: true,
		defaultOpacity: 0.3,
	},
];

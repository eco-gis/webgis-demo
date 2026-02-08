// app/map/plugins/_template/toc-items.ts

import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

/**
 * TOC-Items für Template-Plugin
 */
export const TEMPLATE_TOC_ITEMS: readonly TocItemConfig[] = [
	{
		id: "template-points",
		title: "Template · Punkte",
		mapLayerIds: ["template-points"],
		labelLayerIds: [],
		defaultVisible: true,
		defaultLabelsVisible: false,
		defaultOpacity: 1,
	},
] as const;

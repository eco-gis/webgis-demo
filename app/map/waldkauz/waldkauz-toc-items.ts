// app/map/waldkauz/waldkauz-toc-items.ts
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import { WALDKAUZ_LAYER_IDS } from "@/app/map/waldkauz/waldkauz-overlay.local";

export const DEMO_TOC_ITEMS: readonly TocItemConfig[] = [
	{
		id: "waldkauz-points",
		title: "Waldkauz · Standorte der Nachweise",
		mapLayerIds: [WALDKAUZ_LAYER_IDS.points],
		labelLayerIds: [],
		defaultVisible: true,
		defaultLabelsVisible: false,
		defaultOpacity: 1,
	},
	{
		id: "waldkauz-buffers",
		title: "Waldkauz · Aktionsradien",
		mapLayerIds: [
			WALDKAUZ_LAYER_IDS.buffer2000Fill,
			WALDKAUZ_LAYER_IDS.buffer2000Line,
			WALDKAUZ_LAYER_IDS.buffer1000Fill,
			WALDKAUZ_LAYER_IDS.buffer1000Line,
			WALDKAUZ_LAYER_IDS.buffer500Fill,
			WALDKAUZ_LAYER_IDS.buffer500Line,
		],
		labelLayerIds: [],
		defaultVisible: true,
		defaultLabelsVisible: false,
		defaultOpacity: 1,
	},
] as const;

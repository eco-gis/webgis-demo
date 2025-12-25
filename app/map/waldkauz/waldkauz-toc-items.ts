// app/map/waldkauz/waldkauz-toc-items.ts
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

export const DEMO_TOC_ITEMS: readonly TocItemConfig[] = [
	{
		id: "waldkauz-points",
		title: "Waldkauz · Standorte der Nachweise",
		mapLayerIds: ["waldkauz-points"],
		labelLayerIds: [],
		defaultVisible: true,
		defaultLabelsVisible: false,
		defaultOpacity: 1,
	},
	{
		id: "waldkauz-buffers",
		title: "Waldkauz · Aktionsradien",
		mapLayerIds: ["waldkauz-buffer-2000", "waldkauz-buffer-1000", "waldkauz-buffer-500"],
		labelLayerIds: [],
		defaultVisible: true,
		defaultLabelsVisible: false,
		defaultOpacity: 1,
	},
] as const;

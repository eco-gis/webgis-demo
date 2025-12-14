import { DEMO_INTERACTIVE_LAYER_IDS } from "@/app/map/demo/demo-interactive-layer-ids";
import { DEMO_OVERLAYS } from "@/app/map/demo/demo-overlays";
import { DEMO_TOC_ITEMS } from "@/app/map/demo/demo-toc-items";

export const MAP_CONFIG = {
	overlays: DEMO_OVERLAYS,
	tocItems: DEMO_TOC_ITEMS,
	interactiveLayerIds: DEMO_INTERACTIVE_LAYER_IDS,
} as const;

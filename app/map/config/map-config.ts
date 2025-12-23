// app/map/map-config.ts

import { DEMO_INTERACTIVE_LAYER_IDS } from "@/app/map/waldkauz/waldkauz-interactive-layer-ids";
import { DEMO_OVERLAYS } from "@/app/map/waldkauz/waldkauz-overlays";
import { DEMO_TOC_ITEMS } from "@/app/map/waldkauz/waldkauz-toc-items";

export const MAP_CONFIG = {
	overlays: DEMO_OVERLAYS,
	tocItems: DEMO_TOC_ITEMS,
	interactiveLayerIds: DEMO_INTERACTIVE_LAYER_IDS,
} as const;

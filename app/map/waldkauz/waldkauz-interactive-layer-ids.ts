// app/map/demo/demo-interactive-layer-ids.ts

import { WALDKAUZ_LAYER_IDS } from "@/app/map/waldkauz/waldkauz-overlay.local";

export type InteractiveLayerId = string;

export const DEMO_INTERACTIVE_LAYER_IDS = [WALDKAUZ_LAYER_IDS.points] as readonly InteractiveLayerId[];

// app/map/waldkauz/waldkauz-overlays.ts

import type { OverlayRegistry } from "@/app/map/overlays/overlay-definition";
import { waldkauzOverlayLocal } from "@/app/map/waldkauz/waldkauz-overlay.local";

export const DEMO_OVERLAYS: OverlayRegistry = {
	waldkauz: waldkauzOverlayLocal,
};

import { DUMMY_LAYERS_ALL } from "@/app/map/demo/dummy-layers";
import { DUMMY_SOURCES } from "@/app/map/demo/dummy-sources";
import type { OverlayDefinition } from "@/app/map/overlays/overlay-definition";

export const DEMO_OVERLAYS: OverlayDefinition = {
	sources: DUMMY_SOURCES,
	layers: DUMMY_LAYERS_ALL,
};

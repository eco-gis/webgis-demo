// app/map/plugins/waldkauz-plugin/index.ts
/**
 * Waldkauz Plugin
 * Demonstriert akustisches Monitoring von Waldkäuzen in Schaffhausen
 */

import type { MapPlugin } from "@/app/map/plugins/types";
import { WALDKAUZ_INTERACTIVE_LAYER_IDS } from "./interactive-layers";
import { waldkauzOverlayLocal, WALDKAUZ_LAYER_IDS } from "./overlays";
import { WALDKAUZ_TOC_ITEMS } from "./toc-items";
import { WaldkauzPointPopup } from "./components/waldkauz-point-popup";

export const waldkauzPlugin: MapPlugin = {
	id: "waldkauz",
	name: "Waldkauz Monitoring",
	description: "Akustisches Monitoring von Waldkäuzen in Schaffhausen (September 2024, Februar 2025)",

	overlays: {
		waldkauz: waldkauzOverlayLocal,
	},

	tocItems: [...WALDKAUZ_TOC_ITEMS],

	interactiveLayerIds: [...WALDKAUZ_INTERACTIVE_LAYER_IDS],

	popupRenderers: {
		[WALDKAUZ_LAYER_IDS.points]: WaldkauzPointPopup,
	},

	layerPrefixes: ["waldkauz-"],

	dataPaths: {
		geojson: "data",
		assets: "data/soundsample",
	},

	enabled: true,
};

// Export für direkte Nutzung (falls gewünscht)
export * from "./overlays";
export * from "./toc-items";
export * from "./interactive-layers";

// app/map/config/map-config.ts

/**
 * Zentrale Map-Konfiguration
 * Lädt dynamisch alle registrierten Plugins
 */

import "@/app/map/plugins"; // Auto-Registration aller Plugins
import {
	getAggregatedInteractiveLayerIds,
	getAggregatedOverlays,
	getAggregatedTocItems,
} from "@/app/map/plugins/plugin-registry";

export const MAP_CONFIG = {
	overlays: getAggregatedOverlays(),
	tocItems: getAggregatedTocItems(),
	interactiveLayerIds: getAggregatedInteractiveLayerIds(),
} as const;

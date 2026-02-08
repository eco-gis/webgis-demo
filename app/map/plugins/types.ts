// app/map/plugins/types.ts

import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import type { OverlayRegistry } from "@/app/map/overlays/overlay-definition";
import type { FC } from "react";

/**
 * Plugin-Manifest Definition
 *
 * Ein Plugin kapselt alle Ressourcen für einen Use-Case:
 * - Overlay-Definitionen (GeoJSON Sources & MapLibre Layers)
 * - TOC-Items (Layer-Konfiguration für Table of Contents)
 * - Interaktive Layer-IDs (für Click/Hover Events)
 * - Popup-Renderer (Custom UI für Feature-Popups)
 * - Layer-Präfixe (für Layer-Ordering)
 */
export interface MapPlugin {
	/** Eindeutige Plugin-ID (z.B. "waldkauz", "fledermaus") */
	id: string;

	/** Plugin-Name (Display) */
	name: string;

	/** Kurzbeschreibung */
	description?: string;

	/** Overlay-Registry mit Sources und Layers */
	overlays: OverlayRegistry;

	/** TOC-Item-Konfigurationen */
	tocItems: TocItemConfig[];

	/** IDs der Layer, die interaktiv sind (Click/Hover) */
	interactiveLayerIds: string[];

	/**
	 * Custom Popup-Renderer für spezifische Layer
	 * Key: Layer-ID, Value: React-Komponente
	 */
	popupRenderers?: Record<string, FC<PopupRendererProps>>;

	/**
	 * Layer-Präfixe für dieses Plugin
	 * Wird für Layer-Ordering verwendet (z.B. ["waldkauz-"])
	 */
	layerPrefixes?: string[];

	/**
	 * Data-Pfade relativ zu /public/
	 * Ermöglicht Plugin-spezifische Datenorganisation
	 */
	dataPaths?: {
		geojson?: string;
		assets?: string;
	};

	/**
	 * Plugin aktiviert/deaktiviert
	 * @default true
	 */
	enabled?: boolean;
}

/**
 * Props für Plugin Popup-Renderer
 */
export interface PopupRendererProps {
	/** GeoJSON Feature */
	feature: GeoJSON.Feature;

	/** Layer-ID */
	layerId?: string;

	/** Optional: MapLibre Map Instance */
	map?: maplibregl.Map | null;
}

/**
 * Plugin-Registry State
 */
export interface PluginRegistry {
	/** Registrierte Plugins (Map für schnellen Zugriff) */
	plugins: Map<string, MapPlugin>;

	/** Registriere ein Plugin */
	register: (plugin: MapPlugin) => void;

	/** Deregistriere ein Plugin */
	unregister: (pluginId: string) => void;

	/** Hole ein Plugin */
	get: (pluginId: string) => MapPlugin | undefined;

	/** Hole alle Plugins */
	getAll: () => MapPlugin[];

	/** Hole nur aktive Plugins */
	getEnabled: () => MapPlugin[];

	/** Prüfe ob Plugin registriert ist */
	has: (pluginId: string) => boolean;
}

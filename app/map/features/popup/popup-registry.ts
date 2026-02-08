// app/map/features/popup/popup-registry.ts
"use client";

import type { MapGeoJSONFeature } from "maplibre-gl";
import type { FC } from "react";

/**
 * Props für Popup-Renderer
 */
export interface PopupRendererProps {
	/** MapLibre GeoJSON Feature */
	feature: MapGeoJSONFeature;

	/** Layer-ID (optional) */
	layerId?: string;

	/** MapLibre Map Instance (optional) */
	map?: maplibregl.Map | null;
}

/**
 * Popup-Renderer-Registry
 * Ermöglicht Plugins, Custom-Popups für spezifische Layer zu registrieren
 */
class PopupRendererRegistry {
	private renderers = new Map<string, FC<PopupRendererProps>>();

	/**
	 * Registriere einen Popup-Renderer für eine Layer-ID
	 */
	register(layerId: string, renderer: FC<PopupRendererProps>): void {
		if (this.renderers.has(layerId)) {
			console.warn(`[PopupRegistry] Renderer für Layer "${layerId}" wird überschrieben`);
		}

		this.renderers.set(layerId, renderer);
		console.log(`[PopupRegistry] Renderer für Layer "${layerId}" registriert`);
	}

	/**
	 * Deregistriere einen Popup-Renderer
	 */
	unregister(layerId: string): void {
		if (!this.renderers.has(layerId)) {
			console.warn(`[PopupRegistry] Kein Renderer für Layer "${layerId}" gefunden`);
			return;
		}

		this.renderers.delete(layerId);
		console.log(`[PopupRegistry] Renderer für Layer "${layerId}" deregistriert`);
	}

	/**
	 * Hole einen Popup-Renderer für eine Layer-ID
	 */
	get(layerId: string): FC<PopupRendererProps> | undefined {
		return this.renderers.get(layerId);
	}

	/**
	 * Prüfe ob ein Renderer für eine Layer-ID existiert
	 */
	has(layerId: string): boolean {
		return this.renderers.has(layerId);
	}

	/**
	 * Hole alle registrierten Layer-IDs
	 */
	getLayerIds(): string[] {
		return Array.from(this.renderers.keys());
	}

	/**
	 * Debug: Zeige alle registrierten Renderer
	 */
	debug(): void {
		console.log("[PopupRegistry] Registrierte Renderer:", Array.from(this.renderers.keys()));
	}
}

/**
 * Globale Popup-Renderer-Registry Instance
 */
export const popupRendererRegistry = new PopupRendererRegistry();

/**
 * Utility: Registriere einen Popup-Renderer
 */
export function registerPopupRenderer(layerId: string, renderer: FC<PopupRendererProps>): void {
	popupRendererRegistry.register(layerId, renderer);
}

/**
 * Utility: Hole einen Popup-Renderer
 */
export function getPopupRenderer(layerId: string): FC<PopupRendererProps> | undefined {
	return popupRendererRegistry.get(layerId);
}

// app/map/plugins/plugin-registry.ts

import type { MapPlugin, PluginRegistry } from "@/app/map/plugins/types";
import { registerPopupRenderer } from "@/app/map/features/popup/popup-registry";

/**
 * Globale Plugin-Registry (Singleton)
 * Verwaltet alle registrierten Map-Plugins
 */
class PluginRegistryImpl implements PluginRegistry {
	public plugins: Map<string, MapPlugin> = new Map();

	register(plugin: MapPlugin): void {
		if (this.plugins.has(plugin.id)) {
			console.warn(`[PluginRegistry] Plugin "${plugin.id}" ist bereits registriert. Überschreibe...`);
		}

		this.plugins.set(plugin.id, {
			...plugin,
			enabled: plugin.enabled ?? true,
		});

		// Registriere Popup-Renderer automatisch
		if (plugin.popupRenderers) {
			for (const [layerId, renderer] of Object.entries(plugin.popupRenderers)) {
				registerPopupRenderer(layerId, renderer);
			}
		}

		console.log(`[PluginRegistry] Plugin "${plugin.id}" registriert (${plugin.tocItems.length} TOC Items)`);
	}

	unregister(pluginId: string): void {
		if (!this.plugins.has(pluginId)) {
			console.warn(`[PluginRegistry] Plugin "${pluginId}" nicht gefunden`);
			return;
		}

		this.plugins.delete(pluginId);
		console.log(`[PluginRegistry] Plugin "${pluginId}" deregistriert`);
	}

	get(pluginId: string): MapPlugin | undefined {
		return this.plugins.get(pluginId);
	}

	getAll(): MapPlugin[] {
		return Array.from(this.plugins.values());
	}

	getEnabled(): MapPlugin[] {
		return this.getAll().filter((p) => p.enabled !== false);
	}

	has(pluginId: string): boolean {
		return this.plugins.has(pluginId);
	}

	/**
	 * Debug: Zeige alle registrierten Plugins
	 */
	debug(): void {
		console.table(
			this.getAll().map((p) => ({
				id: p.id,
				name: p.name,
				enabled: p.enabled,
				tocItems: p.tocItems.length,
				interactiveLayers: p.interactiveLayerIds.length,
				hasPopupRenderers: !!p.popupRenderers,
			})),
		);
	}
}

/**
 * Globale Plugin-Registry Instance
 */
export const pluginRegistry = new PluginRegistryImpl();

/**
 * Utility: Registriere ein Plugin
 */
export function registerPlugin(plugin: MapPlugin): void {
	pluginRegistry.register(plugin);
}

/**
 * Utility: Hole alle aggregierten Overlays aus allen Plugins
 */
export function getAggregatedOverlays() {
	const plugins = pluginRegistry.getEnabled();
	const overlays: Record<string, unknown> = {};

	for (const plugin of plugins) {
		Object.assign(overlays, plugin.overlays);
	}

	return overlays;
}

/**
 * Utility: Hole alle aggregierten TOC-Items aus allen Plugins
 */
export function getAggregatedTocItems() {
	const plugins = pluginRegistry.getEnabled();
	return plugins.flatMap((p) => p.tocItems);
}

/**
 * Utility: Hole alle aggregierten interaktiven Layer-IDs
 */
export function getAggregatedInteractiveLayerIds() {
	const plugins = pluginRegistry.getEnabled();
	return plugins.flatMap((p) => p.interactiveLayerIds);
}

/**
 * Utility: Hole alle Layer-Präfixe aus Plugins
 */
export function getAggregatedLayerPrefixes() {
	const plugins = pluginRegistry.getEnabled();
	return plugins.flatMap((p) => p.layerPrefixes || []);
}

/**
 * Utility: Hole alle Popup-Renderer aus Plugins
 */
export function getAggregatedPopupRenderers() {
	const plugins = pluginRegistry.getEnabled();
	// biome-ignore lint/suspicious/noExplicitAny: Popup-Renderer können verschiedene Props haben
	const renderers: Record<string, React.FC<any>> = {};

	for (const plugin of plugins) {
		if (plugin.popupRenderers) {
			Object.assign(renderers, plugin.popupRenderers);
		}
	}

	return renderers;
}

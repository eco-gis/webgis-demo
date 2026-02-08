// app/map/plugins/use-plugins.ts
"use client";

import { pluginRegistry } from "@/app/map/plugins/plugin-registry";
import type { MapPlugin } from "@/app/map/plugins/types";
import { useMemo } from "react";

/**
 * Hook: Zugriff auf Plugin-Registry
 *
 * @example
 * const { plugins, getPlugin } = usePlugins();
 * const waldkauz = getPlugin("waldkauz");
 */
export function usePlugins() {
	const plugins = useMemo(() => pluginRegistry.getAll(), []);
	const enabledPlugins = useMemo(() => pluginRegistry.getEnabled(), []);

	return {
		/** Alle registrierten Plugins */
		plugins,

		/** Nur aktivierte Plugins */
		enabledPlugins,

		/** Hole ein spezifisches Plugin */
		getPlugin: (id: string): MapPlugin | undefined => pluginRegistry.get(id),

		/** Prüfe ob Plugin existiert */
		hasPlugin: (id: string): boolean => pluginRegistry.has(id),

		/** Registry-Instanz (für fortgeschrittene Nutzung) */
		registry: pluginRegistry,
	};
}

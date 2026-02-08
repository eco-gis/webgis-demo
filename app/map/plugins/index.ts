// app/map/plugins/index.ts
/**
 * Zentrale Plugin-Registration
 * Alle Plugins werden hier registriert
 */

import { registerPlugin } from "./plugin-registry";
import { waldkauzPlugin } from "./waldkauz-plugin";

/**
 * Registriere alle Plugins
 * Diese Funktion wird beim App-Start aufgerufen
 */
export function registerAllPlugins() {
	// Registriere Waldkauz-Plugin
	registerPlugin(waldkauzPlugin);

	// Weitere Plugins können hier hinzugefügt werden:
	// registerPlugin(fledermausPlugin);
	// registerPlugin(amphibienPlugin);

	console.log("[Plugins] Alle Plugins registriert");
}

// Auto-Registration beim Import
registerAllPlugins();

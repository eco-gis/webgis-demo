// app/map/plugins/_template/index.ts
/**
 * Template Plugin
 * 
 * Kopiere diesen Ordner und passe ihn für dein Use-Case an:
 * 1. Benenne den Ordner um: _template → my-plugin
 * 2. Ersetze "template" mit deiner Plugin-ID
 * 3. Erstelle Overlay-Definitionen in overlays.ts
 * 4. Erstelle TOC-Items in toc-items.ts
 * 5. Füge Custom-Komponenten in components/ hinzu
 * 6. Registriere Plugin in /app/map/plugins/index.ts
 */

import type { MapPlugin } from "@/app/map/plugins/types";
import { TEMPLATE_INTERACTIVE_LAYER_IDS } from "./interactive-layers";
import { templateOverlay, TEMPLATE_LAYER_IDS } from "./overlays";
import { TEMPLATE_TOC_ITEMS } from "./toc-items";
// import { TemplatePointPopup } from "./components/template-point-popup";

export const templatePlugin: MapPlugin = {
	// 1. Plugin-ID (eindeutig!)
	id: "template",

	// 2. Display-Name
	name: "Template Plugin",

	// 3. Beschreibung
	description: "Template für neue Plugins",

	// 4. Overlays (MapLibre Sources & Layers)
	overlays: {
		template: templateOverlay,
	},

	// 5. TOC-Items (Layer-Konfiguration)
	tocItems: [...TEMPLATE_TOC_ITEMS],

	// 6. Interaktive Layer-IDs (für Click/Hover)
	interactiveLayerIds: [...TEMPLATE_INTERACTIVE_LAYER_IDS],

	// 7. Custom Popup-Renderer (optional)
	popupRenderers: {
		// [TEMPLATE_LAYER_IDS.points]: TemplatePointPopup,
	},

	// 8. Layer-Präfixe (für Layer-Ordering)
	layerPrefixes: ["template-"],

	// 9. Data-Pfade (optional)
	dataPaths: {
		geojson: "data/plugins/template",
		assets: "data/plugins/template/assets",
	},

	// 10. Plugin aktiviert/deaktiviert
	enabled: true,
};

// Export für direkte Nutzung
export * from "./overlays";
export * from "./toc-items";
export * from "./interactive-layers";

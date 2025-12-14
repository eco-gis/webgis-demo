// app/map/demo/demo-interactive-layer-ids.ts

import { DEMO_OVERLAYS } from "./demo-overlays";

export type InteractiveLayerId = string;

export const DEMO_INTERACTIVE_LAYER_IDS = DEMO_OVERLAYS.layers
	.map((l) => l.id)
	.filter((id) => {
		// Labels / Texte meist nicht abfragbar oder ungewollt
		if (id.includes("label")) return false;

		// Sketch/Preview Layer vom Drawing nicht anklickbar machen
		if (id.includes("sketch")) return false;

		// Suche-Marker nicht anklickbar
		if (id.includes("search")) return false;

		return true;
	}) as readonly InteractiveLayerId[];

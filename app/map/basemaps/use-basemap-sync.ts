"use client";

import {
	type MapTilerStyleId,
	mapTilerStyleUrl,
} from "@/app/lib/maptiler/styles";
import { reorderAppLayers } from "@/app/map/core/layer-order";
import type {
	LayerSpecification,
	Map as MaplibreMap,
	SourceSpecification,
} from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { BasemapId } from "./basemap-config";
import { getBasemapById } from "./basemap-config";

/**
 * Lädt die Overlays aus der style.json und integriert sie in die Map.
 */
async function restoreOverlays(map: MaplibreMap) {
	try {
		const res = await fetch("/data/style.json", { cache: "no-store" });
		if (!res.ok) throw new Error(`Style fetch failed: ${res.status}`);

		const { sources, layers } = await res.json();

		// 1. Quellen hinzufügen
		if (sources) {
			Object.entries(sources).forEach(([id, spec]) => {
				if (!map.getSource(id)) {
					map.addSource(id, spec as SourceSpecification);
				}
			});
		}

		// 2. Layer hinzufügen
		if (layers) {
			layers.forEach((layer: LayerSpecification) => {
				if (!map.getLayer(layer.id)) {
					map.addLayer(layer);
				}
			});
		}

		// 3. Layer-Ordnung sicherstellen
		reorderAppLayers(map);
		map.fire("basemap.ready");
	} catch (err) {
		console.error("❌ Fehler beim Wiederherstellen der Overlays:", err);
	}
}

export function useBasemapSync(
	map: MaplibreMap | null,
	basemapId: BasemapId,
): void {
	const activeRequestId = useRef(0);

	useEffect(() => {
		if (!map) return;

		// Eindeutige ID für diesen Effekt-Lauf (verhindert Race Conditions)
		const currentId = ++activeRequestId.current;
		const def = getBasemapById(basemapId);
		const nextStyleUrl = mapTilerStyleUrl(def.styleId as MapTilerStyleId);

		console.log(`🗺️ Wechsel zu Basemap: ${def.label}`);

		// Callback für das Laden des neuen Styles
		const handleStyleLoad = () => {
			// Nur ausführen, wenn dies noch der aktuellste Request ist
			if (currentId === activeRequestId.current) {
				restoreOverlays(map);
			}
		};

		// Event-Listener registrieren (styledata ist zuverlässiger als idle)
		map.once("styledata", handleStyleLoad);

		// Den eigentlichen Style-Wechsel triggern
		map.setStyle(nextStyleUrl);

		return () => {
			map.off("styledata", handleStyleLoad);
		};
	}, [map, basemapId]);
}

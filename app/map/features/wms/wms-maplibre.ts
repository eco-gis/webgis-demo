import type { Map as MapLibreMap } from "maplibre-gl";
import type { WmsUrlConfig } from "./wms-types";

/**
 * Erstellt eine klassische WMS GetMap URL für Raster-Sources,
 * falls kein WMTS verfügbar ist.
 */
function buildClassicWmsUrl(cfg: WmsUrlConfig): string {
	const url = new URL(cfg.baseUrl);
	url.searchParams.set("SERVICE", "WMS");
	url.searchParams.set("VERSION", "1.3.0");
	url.searchParams.set("REQUEST", "GetMap");
	url.searchParams.set("LAYERS", cfg.layers);
	url.searchParams.set("STYLES", "");
	url.searchParams.set("CRS", "EPSG:3857");
	url.searchParams.set("BBOX", "{bbox-epsg-3857}");
	url.searchParams.set("WIDTH", "256");
	url.searchParams.set("HEIGHT", "256");
	url.searchParams.set("FORMAT", cfg.format);
	url.searchParams.set("TRANSPARENT", cfg.transparent ? "TRUE" : "FALSE");

	// MapLibre erwartet die URL meist decodiert für die Template-Platzhalter
	return decodeURIComponent(url.toString());
}

export function removeWmsLayer(map: MapLibreMap, id: string): void {
	if (map.getLayer(id)) map.removeLayer(id);
	if (map.getSource(id)) map.removeSource(id);
}

export function upsertWmsLayer(map: MapLibreMap, cfg: WmsUrlConfig): void {
	const sourceId = cfg.id;

	if (!map.getSource(sourceId)) {
		// 1. Source prüfen und ggf. hinzufügen
		const isWmts = cfg.baseUrl.includes("{z}");
		const tileUrl = isWmts ? cfg.baseUrl : buildClassicWmsUrl(cfg);

		map.addSource(sourceId, {
			type: "raster",
			tiles: [tileUrl],
			tileSize: 256,
			attribution: "© swisstopo",
		});
	}

	if (!map.getLayer(sourceId)) {
		// 2. Layer prüfen und ggf. hinzufügen
		// Wir erzwingen eine kurze Validierung, ob die Source existiert
		if (map.getSource(sourceId)) {
			map.addLayer({
				id: sourceId,
				type: "raster",
				source: sourceId,
				metadata: {
					geoRole: "overlay",
					isDynamic: true,
				},
				paint: {
					"raster-opacity": cfg.opacity ?? 1,
					"raster-resampling": "linear",
				},
			});
		}
	} else {
		// Update falls vorhanden
		map.setPaintProperty(sourceId, "raster-opacity", cfg.opacity ?? 1);
	}
}

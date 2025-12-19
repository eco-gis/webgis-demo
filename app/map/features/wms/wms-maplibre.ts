// app/map/features/wms/wms-maplibre.ts
import type {
	LayerSpecification,
	Map as MapLibreMap,
	RasterSourceSpecification,
} from "maplibre-gl";
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
	if (!map.getSource(cfg.id)) {
		// Falls die URL {z} enthält, ist es bereits ein WMTS Template
		const isWmts = cfg.baseUrl.includes("{z}");
		const tileUrl = isWmts ? cfg.baseUrl : buildClassicWmsUrl(cfg);

		const sourceSpec: RasterSourceSpecification = {
			type: "raster",
			tiles: [tileUrl],
			tileSize: 256,
			attribution: "© swisstopo",
		};

		map.addSource(cfg.id, sourceSpec);
	}

	if (!map.getLayer(cfg.id)) {
		const layerSpec: LayerSpecification = {
			id: cfg.id,
			type: "raster",
			source: cfg.id,
			paint: {
				"raster-opacity": cfg.opacity ?? 1,
				"raster-resampling": "linear",
			},
		};
		map.addLayer(layerSpec);
	} else {
		// Falls der Layer schon existiert, nur Opazität updaten
		map.setPaintProperty(cfg.id, "raster-opacity", cfg.opacity ?? 1);
	}
}

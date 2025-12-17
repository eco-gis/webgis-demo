import type {
	LayerSpecification,
	Map as MapLibreMap,
	SourceSpecification,
} from "maplibre-gl";
import type { WmsUrlConfig } from "./wms-types";

function clamp01(v: number | undefined, fallback = 1): number {
	const x = v ?? fallback;
	if (x < 0) return 0;
	if (x > 1) return 1;
	return x;
}

// Wichtig: bbox placeholder NICHT URL-encoden!
function buildSwisstopoWmsTileUrl(cfg: WmsUrlConfig): string {
	const base = cfg.baseUrl.includes("?") ? cfg.baseUrl : `${cfg.baseUrl}?`;

	const qs =
		`SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` +
		`&LAYERS=${encodeURIComponent(cfg.layers)}` +
		`&STYLES=${encodeURIComponent("default")}` +
		`&CRS=${encodeURIComponent("EPSG:3857")}` +
		`&BBOX={bbox-epsg-3857}` +
		`&WIDTH=256&HEIGHT=256` +
		`&FORMAT=${encodeURIComponent(cfg.format)}` +
		`&TRANSPARENT=${cfg.transparent ? "TRUE" : "FALSE"}`;

	return `${base}${base.endsWith("?") || base.endsWith("&") ? "" : "&"}${qs}`;
}

export function removeWmsLayer(map: MapLibreMap, id: string): void {
	if (map.getLayer(id)) map.removeLayer(id);
	if (map.getSource(id)) map.removeSource(id);
}

export function upsertWmsLayer(map: MapLibreMap, cfg: WmsUrlConfig): void {
	// Source
	if (!map.getSource(cfg.id)) {
		const src: SourceSpecification = {
			type: "raster",
			tiles: [buildSwisstopoWmsTileUrl(cfg)],
			tileSize: 256,
		};
		map.addSource(cfg.id, src);
	}

	// Layer
	if (!map.getLayer(cfg.id)) {
		const layer: LayerSpecification = {
			id: cfg.id,
			type: "raster",
			source: cfg.id,
			paint: { "raster-opacity": clamp01(cfg.opacity) },
		};
		map.addLayer(layer);
	} else {
		map.setPaintProperty(cfg.id, "raster-opacity", clamp01(cfg.opacity));
	}
}

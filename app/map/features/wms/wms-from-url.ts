// app/map/features/wms/wms-from-url.ts
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import type { WmsImageFormat, WmsUrlConfig } from "./wms-types";

function clamp01(n: number): number {
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

function asFormat(v: string | null | undefined): WmsImageFormat {
	if (v === "image/jpeg") return "image/jpeg";
	return "image/png";
}

export function parseWmsFromSearch(search: string): WmsUrlConfig | null {
	const sp = new URLSearchParams(search);

	const baseUrl = sp.get("wmsUrl")?.trim();
	const layers = sp.get("wmsLayers")?.trim();
	if (!baseUrl || !layers) return null;

	const rawId = sp.get("wmsId")?.trim() || "layer";
	const id = `wms:${rawId}` as const;

	const title = sp.get("wmsTitle")?.trim() || rawId;

	const format = asFormat(sp.get("wmsFormat"));
	const transparent = (sp.get("wmsTransparent") ?? "true") !== "false";

	const opacityRaw = sp.get("wmsOpacity");
	const opacity = opacityRaw ? clamp01(Number(opacityRaw)) : undefined;

	return { id, title, baseUrl, layers, format, transparent, opacity };
}

function firstLayerName(layers: string): string {
	const first = layers.split(",")[0]?.trim();
	return first && first.length > 0 ? first : layers.trim();
}

/**
 * Bereinigt swisstopo Layer-Namen von technischen Suffixen.
 */
function normalizeSwisstopoLayerBase(name: string): string {
	return name
		.replace(/\.(fill|line|circle|symbol|point)$/i, "") // Entfernt Typ-Suffixe
		.split("{")[0] // Entfernt mögliche Template-Reste wie {z}
		.replace(/\.$/, ""); // Entfernt hängende Punkte
}

function buildWmsLegendGraphicUrl(
	cfg: WmsUrlConfig,
	layerBase: string,
): string {
	const u = new URL(cfg.baseUrl);
	u.searchParams.set("SERVICE", "WMS");
	u.searchParams.set("REQUEST", "GetLegendGraphic");
	u.searchParams.set("FORMAT", "image/png");
	u.searchParams.set("LAYER", layerBase);
	u.searchParams.set("VERSION", "1.3.0");
	u.searchParams.set("SLD_VERSION", "1.1.0");
	return u.toString();
}

function isSwisstopoBaseUrl(url: string): boolean {
	try {
		const u = new URL(url);
		// Deckt wms.geo.admin.ch, api3.geo.admin.ch und wmts.geo.admin.ch ab
		return u.host.includes("geo.admin.ch");
	} catch {
		return false;
	}
}

/**
 * Erzeugt die URL zum HTML-Fragment der swisstopo REST API.
 * Das LegendPanel nutzt diese URL, um das Bild zu extrahieren und Metadaten im Popover anzuzeigen.
 */
function buildSwisstopoRestLegendUrl(layerBase: string, lang = "de"): string {
	// Falls die ID leer ist, Fallback auf einen bekannten Layer zum Testen oder leer
	if (!layerBase) return "";

	// Wir nutzen den offiziellen REST-Service
	return `https://api3.geo.admin.ch/rest/services/ech/MapServer/${layerBase}/legend?lang=${lang}`;
}

function buildWmsLegendUrl(cfg: WmsUrlConfig): string {
	const rawFirst = firstLayerName(cfg.layers);
	const layerBase = normalizeSwisstopoLayerBase(rawFirst);

	// Erkennung ob Swisstopo Layer (über URL oder Namensschema)
	const isSwisstopo =
		isSwisstopoBaseUrl(cfg.baseUrl) || layerBase.startsWith("ch.");

	if (isSwisstopo) {
		return buildSwisstopoRestLegendUrl(layerBase, "de");
	}

	// Standard OGC WMS GetLegendGraphic für andere Anbieter
	return buildWmsGraphicLegendUrl(cfg, layerBase);
}

// Alias für Konsistenz
const buildWmsGraphicLegendUrl = buildWmsLegendGraphicUrl;

export function toTocItem(cfg: WmsUrlConfig): TocItemConfig {
	return {
		id: cfg.id,
		title: cfg.title,
		mapLayerIds: [String(cfg.id)],
		labelLayerIds: [],
		defaultVisible: true,
		defaultOpacity: cfg.opacity ?? 1,
		defaultLabelsVisible: false,
		legendUrl: buildWmsLegendUrl(cfg),
	};
}
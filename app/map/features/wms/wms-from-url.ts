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

function normalizeSwisstopoLayerBase(name: string): string {
	// du hast intern teilweise ".fill/.line/.circle" in cfg.layers hängen – das ist NICHT der WMS-Layername
	return name.replace(/\.(fill|line|circle|symbol)$/i, "");
}

type LegendHint = "fill" | "line" | "point" | "unknown";

function guessLegendHintFromRawName(raw: string): LegendHint {
	const lower = raw.toLowerCase();
	if (lower.includes(".fill")) return "fill";
	if (lower.includes(".line")) return "line";
	if (lower.includes(".circle") || lower.includes(".symbol") || lower.includes(".point"))
		return "point";
	return "unknown";
}

/**
 * Swisstopo (api3) hat oft Legend-PNGs wie:
 *  - <layer>.fill_de.png
 *  - <layer>.line_de.png
 *  - <layer>.point_de.png
 * und manchmal auch ohne Suffix (aber nicht zuverlässig).
 */
function buildSwisstopoStaticLegendUrl(layerBase: string, hint: LegendHint): string {
	const suffixes: string[] =
		hint === "fill"
			? ["fill_de", "line_de", "point_de", "de"]
			: hint === "line"
				? ["line_de", "fill_de", "point_de", "de"]
				: hint === "point"
					? ["point_de", "circle_de", "symbol_de", "de", "fill_de", "line_de"]
					: ["fill_de", "line_de", "point_de", "de"];

	// Wir liefern einen “primary” URL zurück; der Legend-Renderer macht dann Fallbacks via onError.
	// Darum: wir starten mit dem wahrscheinlichsten.
	return `https://api3.geo.admin.ch/static/images/legends/${layerBase}.${suffixes[0]}.png`;
}

/**
 * Fallback: klassisches WMS GetLegendGraphic (für Nicht-swisstopo oder wenn du es später brauchst).
 * Für swisstopo nutze bevorzugt api3 statische Bilder.
 */
function buildWmsLegendGraphicUrl(cfg: WmsUrlConfig, layerBase: string): string {
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
		return u.host === "wms.geo.admin.ch" || u.host === "api3.geo.admin.ch";
	} catch {
		return false;
	}
}

function buildWmsLegendUrl(cfg: WmsUrlConfig): string {
	const rawFirst = firstLayerName(cfg.layers);
	const layerBase = normalizeSwisstopoLayerBase(rawFirst);

	if (isSwisstopoBaseUrl(cfg.baseUrl) && layerBase.startsWith("ch.swisstopo.")) {
		const hint = guessLegendHintFromRawName(rawFirst);
		return buildSwisstopoStaticLegendUrl(layerBase, hint);
	}

	// generic
	return buildWmsLegendGraphicUrl(cfg, layerBase);
}

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

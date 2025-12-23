// app/map/features/wms/wms-from-url.ts
"use client";

import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import type { WmsImageFormat, WmsUrlConfig } from "./wms-types";

function clamp01(n: number): number {
	if (!Number.isFinite(n)) return 1;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

function asFormat(v: string | null | undefined): WmsImageFormat {
	return v === "image/jpeg" ? "image/jpeg" : "image/png";
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
	const opacity = opacityRaw != null && opacityRaw.trim().length > 0 ? clamp01(Number(opacityRaw)) : undefined;

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
		.replace(/\.(fill|line|circle|symbol|point)$/i, "")
		.split("{")[0]
		.replace(/\.$/, "");
}

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
		return u.host.includes("geo.admin.ch");
	} catch {
		return false;
	}
}

/**
 * URL zur swisstopo REST-Legende.
 * (LegendPanel extrahiert daraus Bild + Metadaten.)
 */
function buildSwisstopoRestLegendUrl(layerBase: string, lang = "de"): string {
	if (!layerBase) return "";
	return `https://api3.geo.admin.ch/rest/services/ech/MapServer/${layerBase}/legend?lang=${lang}`;
}

function buildWmsLegendUrl(cfg: WmsUrlConfig): string {
	const rawFirst = firstLayerName(cfg.layers);
	const layerBase = normalizeSwisstopoLayerBase(rawFirst);

	const isSwisstopo = isSwisstopoBaseUrl(cfg.baseUrl) || layerBase.startsWith("ch.");
	if (isSwisstopo) return buildSwisstopoRestLegendUrl(layerBase, "de");

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

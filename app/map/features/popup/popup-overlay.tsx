// app/map/features/popup/popup-overlay.tsx
"use client";

import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import type maplibregl from "maplibre-gl";
import { Fragment, useMemo } from "react";
import { POPUP_CONFIG, type PopupLayerConfig } from "../../config/popup-config";

import type { PopupState } from "./types";

type LegendSwatchKind = "fill" | "line" | "circle";
type LegendItem = {
	label: string;
	swatch: { kind: LegendSwatchKind; value: string };
};

function normalizePopupLayerId(raw: string): string {
	// Entfernt Suffixe wie -fill, -outline, -label UND -cluster, -cluster-count
	return raw.replace(
		/-(fill|outline|label|cluster|cluster-count|clusters)$/i,
		"",
	);
}
function getPropsRec(f: maplibregl.MapGeoJSONFeature): Record<string, unknown> {
	return isRecord(f.properties) ? f.properties : {};
}

function getConfiguredTitle(
	cfg: PopupLayerConfig | null,
	props: Record<string, unknown>,
	fallback: string,
): string {
	if (!cfg?.titleKey) return fallback;
	const v = props[cfg.titleKey];
	return v === null || v === undefined || v === "" ? fallback : String(v);
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function LegendSwatch(props: { kind: LegendSwatchKind; value: string }) {
	const { kind, value } = props;
	if (kind === "circle") {
		return (
			<span
				className="h-2.5 w-2.5 rounded-full ring-1 ring-border"
				style={{ backgroundColor: value }}
			/>
		);
	}
	if (kind === "line") {
		return (
			<span className="h-0.5 w-6 rounded" style={{ backgroundColor: value }} />
		);
	}
	return (
		<span
			className="h-2.5 w-2.5 rounded-sm border"
			style={{ backgroundColor: value }}
		/>
	);
}

function getFeatureTitle(f: maplibregl.MapGeoJSONFeature, idx: number): string {
	const props = isRecord(f.properties) ? f.properties : {};
	const stable =
		typeof f.id === "string" || typeof f.id === "number"
			? `id=${f.id}`
			: typeof props.fid === "number" || typeof props.fid === "string"
				? `fid=${props.fid}`
				: `#${idx + 1}`;

	const geom = f.geometry?.type ?? "Geometry";
	return `${geom} · ${stable}`;
}

function uniqueStableKey(f: maplibregl.MapGeoJSONFeature, idx: number): string {
	const props = isRecord(f.properties) ? f.properties : {};
	const fid = props.fid;
	const id =
		typeof f.id === "string" || typeof f.id === "number" ? String(f.id) : null;

	return [
		f.layer?.id ?? "layer",
		typeof f.source === "string" ? f.source : "src",
		id ??
			(typeof fid === "string" || typeof fid === "number"
				? String(fid)
				: `i${idx}`),
	].join("::");
}

function findTocForLayerId(
	tocItems: readonly TocItemConfig[],
	layerId: string,
): TocItemConfig | null {
	for (const t of tocItems) {
		const all = [...(t.mapLayerIds ?? []), ...(t.labelLayerIds ?? [])];
		if (all.includes(layerId)) return t;
	}
	return null;
}

function formatByConfig(v: unknown, fmt?: "text" | "int" | "float"): string {
	if (v === null || v === undefined) return "";

	if (fmt === "int") {
		const n = typeof v === "number" ? v : Number(String(v));
		return Number.isFinite(n) ? String(Math.round(n)) : String(v);
	}

	if (fmt === "float") {
		const n = typeof v === "number" ? v : Number(String(v));
		return Number.isFinite(n) ? n.toFixed(2) : String(v);
	}

	return String(v);
}

function evalExpr(expr: unknown, props: Record<string, unknown>): unknown {
	if (
		expr === null ||
		typeof expr === "string" ||
		typeof expr === "number" ||
		typeof expr === "boolean"
	)
		return expr;

	if (!Array.isArray(expr) || expr.length === 0) return undefined;

	const [op, ...rest] = expr;

	if (op === "get") {
		const key = rest[0];
		return typeof key === "string" ? props[key] : undefined;
	}

	if (op === "coalesce") {
		for (const r of rest) {
			const v = evalExpr(r, props);
			if (v !== null && v !== undefined && v !== "") return v;
		}
		return undefined;
	}

	if (op === "to-string") {
		const v = evalExpr(rest[0], props);
		return v === null || v === undefined ? "" : String(v);
	}

	if (op === "match") {
		const input = evalExpr(rest[0], props);
		const pairs = rest.slice(1, -1);
		const fallback = rest[rest.length - 1];

		for (let i = 0; i + 1 < pairs.length; i += 2) {
			if (input === pairs[i]) return pairs[i + 1];
		}
		return fallback;
	}

	if (op === "step") {
		const inputRaw = evalExpr(rest[0], props);
		const input =
			typeof inputRaw === "number" ? inputRaw : Number(String(inputRaw));

		const base = rest[1];
		if (!Number.isFinite(input)) return base;

		for (let i = 2; i + 1 < rest.length; i += 2) {
			const stop = rest[i];
			const out = rest[i + 1];
			if (typeof stop === "number" && input < stop) return out;
		}
		return rest[rest.length - 1];
	}

	if (op === "interpolate") {
		// ["interpolate", ["linear"], input, stop1, out1, ...]
		const inputRaw = evalExpr(rest[1], props);
		const input =
			typeof inputRaw === "number" ? inputRaw : Number(String(inputRaw));
		if (!Number.isFinite(input)) return undefined;

		const stops = rest.slice(2);
		for (let i = 0; i + 1 < stops.length; i += 2) {
			const stop = stops[i];
			const out = stops[i + 1];
			if (typeof stop === "number" && input <= stop) return out;
		}
		return stops.length >= 2 ? stops[stops.length - 1] : undefined;
	}

	return undefined;
}

function resolveColor(
	expr: unknown,
	props: Record<string, unknown>,
): string | null {
	if (typeof expr === "string" && expr.trim()) return expr;
	const v = evalExpr(expr, props);
	return typeof v === "string" && v.trim() ? v : null;
}

function getFeatureSwatches(
	map: maplibregl.Map,
	f: maplibregl.MapGeoJSONFeature,
	layerIdOverride?: string,
): LegendItem[] {
	const layerId = layerIdOverride ?? f.layer?.id;
	if (!layerId) return [];

	const layer = map.getLayer(layerId);
	if (!layer) return [];

	const props = isRecord(f.properties) ? f.properties : {};
	const out: LegendItem[] = [];

	if (layer.type === "fill") {
		const fill = map.getPaintProperty(layerId, "fill-color") as unknown;
		const outline = map.getPaintProperty(
			layerId,
			"fill-outline-color",
		) as unknown;

		const fillColor = resolveColor(fill, props);
		const outlineColor = resolveColor(outline, props);

		if (fillColor)
			out.push({ label: "Fläche", swatch: { kind: "fill", value: fillColor } });
		if (outlineColor)
			out.push({
				label: "Linie",
				swatch: { kind: "line", value: outlineColor },
			});
	}

	if (layer.type === "line") {
		const line = map.getPaintProperty(layerId, "line-color") as unknown;
		const c = resolveColor(line, props);
		if (c) out.push({ label: "Linie", swatch: { kind: "line", value: c } });
	}

	if (layer.type === "circle") {
		const circle = map.getPaintProperty(layerId, "circle-color") as unknown;
		const c = resolveColor(circle, props);
		if (c) out.push({ label: "Punkt", swatch: { kind: "circle", value: c } });
	}

	return out;
}

export function PopupOverlay(props: {
	map: maplibregl.Map | null;
	popup: PopupState;
	onClose: () => void;
	tocItems: readonly TocItemConfig[];
}) {
	const { map, popup, onClose, tocItems } = props;

	const sections = useMemo(() => {
		if (!popup.open) return [];

		const byKey = new Map<
			string,
			{
				toc: TocItemConfig | null;
				layerIds: string[];
				features: maplibregl.MapGeoJSONFeature[];
			}
		>();

		for (const g of popup.groups) {
			const toc = findTocForLayerId(tocItems, g.layerId);
			const key = toc ? `toc:${toc.id}` : `layer:${g.layerId}`;

			const ex = byKey.get(key);
			if (ex) {
				ex.layerIds.push(g.layerId);
				ex.features.push(...g.features);
			} else {
				byKey.set(key, {
					toc,
					layerIds: [g.layerId],
					features: [...g.features],
				});
			}
		}

		const tocOrder = new Map<string, number>();
		tocItems.forEach((t, i) => {
			tocOrder.set(t.id, i);
		});

		const out = [...byKey.values()];
		out.sort((a, b) => {
			if (a.toc && b.toc)
				return (
					(tocOrder.get(a.toc.id) ?? 999) - (tocOrder.get(b.toc.id) ?? 999)
				);
			if (a.toc && !b.toc) return -1;
			if (!a.toc && b.toc) return 1;
			return (a.layerIds[0] ?? "").localeCompare(b.layerIds[0] ?? "");
		});

		return out;
	}, [popup, tocItems]);

	if (!popup.open) return null;

	const totalFeatures = sections.reduce((acc, s) => acc + s.features.length, 0);

	return (
		<div className="pointer-events-auto absolute left-3 top-3 z-50 w-95 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border bg-white shadow-xl">
			<div className="flex items-start justify-between gap-3 border-b bg-white/80 p-3 backdrop-blur">
				<div className="min-w-0">
					<div className="text-sm font-semibold leading-tight">
						{sections.length} Bereiche · {totalFeatures} Treffer
					</div>
					<div className="mt-0.5 text-xs text-gray-500">
						Klick auf einen Treffer, um Details zu öffnen.
					</div>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
				>
					Schliessen
				</button>
			</div>

			<div className="max-h-[60vh] overflow-auto p-3">
				<div className="space-y-4">
					{sections.map((s, si) => {
						const title = s.toc?.title ?? s.layerIds[0] ?? "Unbekannt";
						const sectionKey = s.toc?.id ?? s.layerIds[0] ?? `sec-${si}`;

						return (
							<div key={sectionKey} className="rounded-lg border">
								<div className="flex items-center justify-between gap-3 border-b bg-white/60 p-3">
									<div className="min-w-0">
										<div className="truncate text-sm font-semibold text-gray-900">
											{title}
										</div>
									</div>

									<div className="shrink-0 rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
										{s.features.length}
									</div>
								</div>

								<div className="divide-y">
									{s.features.map((f, idx) => {
										const propsRec = getPropsRec(f);

										if (f.properties?.cluster) {
											propsRec.zoom_hint = "Bitte näher zoomen für Details";
										}

										const rawLayerId =
											f.layer?.id ?? s.layerIds[0] ?? "unknown-layer";
										const normalizedLayerId = normalizePopupLayerId(rawLayerId);

										const cfg = POPUP_CONFIG[normalizedLayerId] ?? null;
										const fallbackTitle = getFeatureTitle(f, idx);

										// Titel-Logik optimieren
										let title = getConfiguredTitle(
											cfg,
											propsRec,
											fallbackTitle,
										);
										if (f.properties?.cluster) {
											title = `${propsRec.point_count} Objekte (Cluster)`;
										}

										const fields = (cfg?.fields ?? [])
											.slice()
											.sort((a, b) => a.order - b.order);

										return (
											<details
												key={uniqueStableKey(f, idx)}
												className="group"
												open
											>
												<summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50 group-open:bg-gray-50/50">
													<div className="min-w-0 flex items-center gap-2">
														{map &&
															(getFeatureSwatches(map, f, rawLayerId).length > 0
																? getFeatureSwatches(map, f, rawLayerId)
																: getFeatureSwatches(map, f, normalizedLayerId)
															)
																.slice(0, 2)
																.map((s) => (
																	<LegendSwatch
																		key={`${s.label}-${s.swatch.value}`}
																		kind={s.swatch.kind}
																		value={s.swatch.value}
																	/>
																))}

														<div className="truncate text-xs font-medium text-gray-900">
															{title}
														</div>
													</div>

													<span className="shrink-0 text-xs text-gray-400 transition-transform group-open:rotate-90">
														›
													</span>
												</summary>

												<div className="px-3 pb-3">
													<div className="mt-2 rounded-md border bg-gray-50 p-2">
														{cfg ? (
															<div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-[11px] leading-snug">
																{fields.map((fconf) => {
																	const raw = propsRec[fconf.key];
																	const empty =
																		raw === null ||
																		raw === undefined ||
																		raw === "";
																	if (empty && fconf.hideIfEmpty) return null;

																	const value = formatByConfig(
																		raw,
																		fconf.format,
																	);

																	return (
																		<Fragment key={fconf.key}>
																			<div className="text-gray-600">
																				{fconf.label}
																			</div>
																			<div className="text-right font-medium text-gray-900">
																				{value || "–"}
																			</div>
																		</Fragment>
																	);
																})}
															</div>
														) : (
															<div className="text-xs text-gray-500">
																Kei Popup-Config für {rawLayerId} (→{" "}
																{normalizedLayerId})
															</div>
														)}
													</div>
												</div>
											</details>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

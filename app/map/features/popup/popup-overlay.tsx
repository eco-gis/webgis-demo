// app/map/features/popup/popup-overlay.tsx
"use client";

import type maplibregl from "maplibre-gl";
import { Fragment } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { useIsMobile } from "@/app/hooks/use-mobile";
import { POPUP_CONFIG, type PopupLayerConfig } from "@/app/map/config/popup-config";
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import type { PopupLayerGroup, PopupState } from "./types";
import { WaldkauzPointPopup } from "./waldkauz-point-popup";

type PropsRecord = Record<string, unknown>;

type GeoJsonPointGeometry = {
	type: "Point";
	coordinates: [number, number] | number[];
};

type GeoJsonGeometry = GeoJsonPointGeometry | { type: string; coordinates?: unknown } | null;

// --- Helper Functions ---

function isRecord(v: unknown): v is PropsRecord {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizePopupLayerId(layerId: string): string {
	const suffixes = [
		"-label",
		"-labels",
		"-fill",
		"-outline",
		"-line",
		"-stroke",
		"-point",
		"-points",
		"-polygon",
		"-polygons",
	] as const;

	for (const s of suffixes) {
		if (layerId.endsWith(s)) return layerId.slice(0, -s.length);
	}
	return layerId;
}

function asString(v: unknown): string | null {
	return typeof v === "string" && v.trim() ? v : null;
}

function asNumber(v: unknown): number | null {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string") {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function fmtInt(n: number): string {
	return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(n);
}

function fmtFloat(n: number): string {
	return new Intl.NumberFormat("de-CH", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(n);
}

function formatByConfig(raw: unknown, format?: "text" | "int" | "float"): string {
	if (raw === null || raw === undefined) return "";

	if (format === "text") return typeof raw === "string" ? raw : String(raw);

	if (format === "int") {
		const n = asNumber(raw);
		return n === null ? "" : fmtInt(n);
	}

	if (format === "float") {
		const n = asNumber(raw);
		return n === null ? "" : fmtFloat(n);
	}

	if (typeof raw === "string") return raw;
	if (typeof raw === "number") return fmtFloat(raw);
	if (typeof raw === "boolean") return raw ? "Ja" : "Nein";
	return String(raw);
}

function layerTitleFromToc(layerId: string, tocItems: readonly TocItemConfig[]): string {
	for (const it of tocItems) {
		const ids = [
			...(Array.isArray(it.mapLayerIds) ? it.mapLayerIds : []),
			...(Array.isArray(it.labelLayerIds) ? it.labelLayerIds : []),
		];
		if (ids.includes(layerId)) return it.title;
	}
	return layerId;
}

function groupLabel(g: PopupLayerGroup, tocItems: readonly TocItemConfig[]): string {
	return layerTitleFromToc(g.layerId, tocItems);
}

function stableFeatureKey(layerId: string, f: maplibregl.MapGeoJSONFeature, fallbackIndex: number): string {
	const props: PropsRecord = isRecord(f.properties) ? f.properties : {};

	const idFromFeature = typeof f.id === "string" || typeof f.id === "number" ? String(f.id) : null;

	const idFromProps = (() => {
		const sId = asString(props.id);
		if (sId) return sId;

		const nId = asNumber(props.id);
		if (nId != null) return String(nId);

		const sLoc = asString(props.location_id);
		if (sLoc) return sLoc;

		return null;
	})();

	const geom = (f.geometry ?? null) as GeoJsonGeometry;

	const geomFallback =
		geom && typeof geom === "object"
			? `${geom.type ?? "geom"}:${JSON.stringify(geom.coordinates ?? null)}`
			: `idx:${fallbackIndex}`;

	return `${layerId}::${idFromFeature ?? idFromProps ?? geomFallback}`;
}

// --- UI helpers ---

function renderConfigFields(cfg: PopupLayerConfig, props: PropsRecord) {
	const fields = [...cfg.fields].sort((a, b) => a.order - b.order);

	return (
		<div className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-[11px] leading-snug">
			{fields.map((fconf) => {
				const raw = props[fconf.key];
				const empty = raw === null || raw === undefined || raw === "";
				if (empty && fconf.hideIfEmpty) return null;

				const value = formatByConfig(raw, fconf.format);

				return (
					<Fragment key={fconf.key}>
						<div className="text-muted-foreground">{fconf.label}</div>
						<div className="text-right font-medium">{value || "–"}</div>
					</Fragment>
				);
			})}
		</div>
	);
}

function featureLabel(f: maplibregl.MapGeoJSONFeature, cfg: PopupLayerConfig | null): string {
	const props: PropsRecord = isRecord(f.properties) ? f.properties : {};
	if (!cfg) return "Objekt";

	if (cfg.titleKey) {
		const v = props[cfg.titleKey];
		const s = asString(v);
		if (s) return s;

		const n = asNumber(v);
		if (n != null) return String(n);
	}

	return cfg.titleLabel || "Objekt";
}

function CloseButton({ onClose }: { onClose: () => void }) {
	return (
		<button
			type="button"
			onClick={onClose}
			className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-foreground transition-colors hover:bg-muted"
			aria-label="Popup schliessen">
			×
		</button>
	);
}

function PopupBody({ groups, tocItems }: { groups: readonly PopupLayerGroup[]; tocItems: readonly TocItemConfig[] }) {
	return (
		<div className="space-y-3">
			{groups.map((g) => {
				const rawLayerId = g.layerId;
				const normalizedLayerId = normalizePopupLayerId(rawLayerId);
				const cfg = POPUP_CONFIG[rawLayerId] ?? POPUP_CONFIG[normalizedLayerId] ?? null;

				return (
					<div key={rawLayerId} className="overflow-hidden rounded-lg border">
						<div className="border-b px-3 py-2">
							<div className="min-w-0 truncate text-xs font-semibold">{groupLabel(g, tocItems)}</div>
						</div>

						<div className="divide-y">
							{g.features.map((f, idx) => {
								const featureKey = stableFeatureKey(rawLayerId, f, idx);
								const props: PropsRecord = isRecord(f.properties) ? f.properties : {};
								const label = featureLabel(f, cfg);

								if (rawLayerId === "waldkauz-points") {
									return (
										<div key={featureKey} className="p-2.5">
											<WaldkauzPointPopup feature={f} />
										</div>
									);
								}

								if (cfg) {
									return (
										<div key={featureKey} className="p-2.5">
											<div className="space-y-2">
												<div className="text-[11px] font-medium">{label}</div>
												{renderConfigFields(cfg, props)}
											</div>
										</div>
									);
								}

								return (
									<div key={featureKey} className="p-2.5 text-xs text-muted-foreground">
										Kei Popup-Config für {rawLayerId}
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}

// --- Main Component ---

export function PopupOverlay({
	popup,
	onClose,
	tocItems,
}: {
	popup: PopupState;
	onClose: () => void;
	tocItems: readonly TocItemConfig[];
}) {
	const isMobile = useIsMobile();
	const isOpen = popup.open;

	if (!isOpen) return null;

	const groups: readonly PopupLayerGroup[] = popup.groups ?? [];

	if (isMobile) {
		return (
			<Drawer
				open={isOpen}
				onOpenChange={(open) => {
					if (!open) onClose();
				}}>
				<DrawerContent className="max-h-[82vh]">
					<DrawerHeader className="pb-2">
						<div className="flex items-center justify-between gap-3">
							<DrawerTitle className="text-sm">Details</DrawerTitle>
							<CloseButton onClose={onClose} />
						</div>
					</DrawerHeader>

					<div className="overflow-y-auto px-3 pb-3">
						<PopupBody groups={groups} tocItems={tocItems} />
					</div>
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<div className="pointer-events-none absolute inset-0 z-50">
			<div
				className="pointer-events-auto absolute left-3 max-w-190"
				style={{
					top: "max(12px, var(--popup-safe-top, 12px))",
					right: "max(12px, var(--popup-safe-right, 96px))",
				}}>
				<div className="overflow-hidden rounded-xl border bg-background shadow-lg">
					<div className="flex items-center justify-between gap-3 border-b px-3 py-2">
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">Details</div>
						</div>
						<CloseButton onClose={onClose} />
					</div>

					<div className="max-h-[min(70vh,560px)] overflow-y-auto p-3">
						<PopupBody groups={groups} tocItems={tocItems} />
					</div>
				</div>
			</div>
		</div>
	);
}

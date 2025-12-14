// app/map/features/legend/legend-panel.tsx
"use client";

import { List } from "lucide-react";
import type maplibregl from "maplibre-gl";
import { useEffect, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/app/components/ui/sheet";

import { useIsMobile } from "@/app/hooks/use-mobile";
import { cn } from "@/app/lib/utils";
import { MAP_CONFIG } from "@/app/map/config/map-config";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import type {
	TocItemConfig,
	TocItemId,
} from "@/app/map/features/toc/toc-types";

type LegendPaintKind = "fill" | "line" | "circle";
type LegendSwatchKind = LegendPaintKind | "polygon";

type PolygonSwatchValue = { fill: string; outline: string | null };
type LegendItem = {
	label: string;
	swatch:
		| { kind: Exclude<LegendSwatchKind, "polygon">; value: string }
		| { kind: "polygon"; value: PolygonSwatchValue };
};
type LegendSection = {
	item: TocItemConfig;
	legend: LegendItem[];
};

type LegendPanelVariant = "sidebar" | "floating";

function Swatch({ kind, value }: LegendItem["swatch"]) {
	if (kind === "circle") {
		return (
			<span
				className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
				style={{ backgroundColor: value }}
			/>
		);
	}

	if (kind === "line") {
		return (
			<span
				className="h-0.5 w-6 shrink-0 rounded ring-1 ring-border/60"
				style={{ backgroundColor: value }}
			/>
		);
	}

	if (kind === "polygon") {
		return (
			<span className="relative h-3 w-6 shrink-0 rounded-sm ring-1 ring-border/30">
				<span
					className="absolute inset-0 rounded-sm"
					style={{ backgroundColor: value.fill, opacity: 0.65 }}
				/>
				{value.outline && (
					<span
						className="absolute inset-0 rounded-sm"
						style={{
							boxShadow: `inset 0 0 0 2px ${value.outline}`,
						}}
					/>
				)}
			</span>
		);
	}

	// fill
	return (
		<span
			className="h-3 w-6 shrink-0 rounded-sm ring-1 ring-border/60"
			style={{ backgroundColor: value, opacity: 0.65 }}
		/>
	);
}

function extractLegendFromPaint(
	kind: LegendPaintKind,
	paintValue: unknown,
	labelFallback: string,
): LegendItem[] {
	// direkte Farbe als string
	if (typeof paintValue === "string" && paintValue.trim()) {
		return [{ label: labelFallback, swatch: { kind, value: paintValue } }];
	}

	if (!Array.isArray(paintValue) || paintValue.length < 2) return [];

	const [op, ...rest] = paintValue;

	// match: ["match", input, k1, v1, k2, v2, fallback]
	if (op === "match") {
		if (rest.length < 4) return [];
		const pairs = rest.slice(1, -1); // nach input
		const fallback = rest[rest.length - 1];

		const out: LegendItem[] = [];
		for (let i = 0; i + 1 < pairs.length; i += 2) {
			const k = pairs[i];
			const v = pairs[i + 1];
			if (
				(typeof k === "string" || typeof k === "number") &&
				typeof v === "string"
			) {
				out.push({ label: String(k), swatch: { kind, value: v } });
			}
		}
		if (typeof fallback === "string") {
			out.push({ label: "Sonst", swatch: { kind, value: fallback } });
		}
		return out;
	}

	// step: ["step", input, baseColor, stop1, color1, stop2, color2, ...]
	if (op === "step") {
		if (rest.length < 3) return [];
		const base = rest[1];
		const stops = rest.slice(2);

		const out: LegendItem[] = [];
		if (typeof base === "string") {
			out.push({
				label: `< ${String(stops[0] ?? "?")}`,
				swatch: { kind, value: base },
			});
		}

		for (let i = 0; i + 1 < stops.length; i += 2) {
			const stop = stops[i];
			const color = stops[i + 1];
			if (typeof color !== "string") continue;

			const nextStop = stops[i + 2];
			const label =
				typeof nextStop === "number"
					? `${String(stop)} – ${String(nextStop)}`
					: `≥ ${String(stop)}`;

			out.push({ label, swatch: { kind, value: color } });
		}
		return out;
	}

	// interpolate: ["interpolate", ["linear"], input, stop1, color1, stop2, color2, ...]
	// -> wir zeigen die Stops als "Stufen" in der Legende
	if (op === "interpolate") {
		// rest: [ ["linear"], input, stop1, color1, ... ]
		const stops = rest.slice(2);
		const out: LegendItem[] = [];

		for (let i = 0; i + 1 < stops.length; i += 2) {
			const stop = stops[i];
			const color = stops[i + 1];
			if (typeof color !== "string") continue;

			const nextStop = stops[i + 2];
			const label =
				typeof nextStop === "number"
					? `${String(stop)} – ${String(nextStop)}`
					: `≥ ${String(stop)}`;

			out.push({ label, swatch: { kind, value: color } });
		}

		// wenn nix extrahiert wurde: fallback leer
		return out;
	}

	return [];
}

function swatchKey(sw: LegendItem["swatch"]): string {
	if (sw.kind === "polygon")
		return `polygon:${sw.value.fill}:${sw.value.outline ?? ""}`;
	return `${sw.kind}:${sw.value}`;
}

function dedupeLegend(items: LegendItem[]): LegendItem[] {
	const seen = new Set<string>();
	return items.filter((i) => {
		const k = `${i.label}|${swatchKey(i.swatch)}`;
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}

function buildLegendForTocItem(
	map: maplibregl.Map,
	toc: TocItemConfig,
): LegendItem[] {
	const out: LegendItem[] = [];

	const layerIds = toc.layerIds ?? [];

	// 1) Alle Fill-Layer in diesem TOC-Item sammeln
	const fillIds: string[] = [];
	for (const id of layerIds) {
		const l = map.getLayer(id);
		if (l?.type === "fill") fillIds.push(id);
	}

	// 2) Falls es Fill gibt: die passenden Outline-IDs markieren (werden NICHT als eigene Linie angezeigt)
	const outlineIdsToSkip = new Set<string>();
	if (fillIds.length > 0) {
		for (const fid of fillIds) {
			outlineIdsToSkip.add(`${fid}-outline`); // Konvention
		}
		// falls du Outline-Layer explizit im TOC drin hast (wie aktuell), auch skippen
		for (const id of layerIds) {
			const l = map.getLayer(id);
			if (l?.type === "line" && id.includes("outline")) {
				outlineIdsToSkip.add(id);
			}
		}
	}

	for (const layerId of layerIds) {
		const layer = map.getLayer(layerId);
		if (!layer) continue;

		if (layer.type === "fill") {
			const fillPaint = map.getPaintProperty(layerId, "fill-color") as unknown;
			const outlinePaint = map.getPaintProperty(
				layerId,
				"fill-outline-color",
			) as unknown;

			const fillColor =
				typeof fillPaint === "string" && fillPaint.trim() ? fillPaint : null;

			let outlineColor =
				typeof outlinePaint === "string" && outlinePaint.trim()
					? outlinePaint
					: null;

			// fallback: separate `${id}-outline`
			if (!outlineColor) {
				// 1) zuerst: explizites outline-layer im gleichen TOC-Item suchen
				const explicitOutlineId =
					(toc.layerIds ?? []).find((id) => id === `${layerId}-outline`) ??
					(toc.layerIds ?? []).find(
						(id) => id.includes("polygons") && id.includes("outline"),
					) ??
					null;

				const outlineLayerId = explicitOutlineId ?? `${layerId}-outline`;

				const outlineLayer = map.getLayer(outlineLayerId);
				if (outlineLayer?.type === "line") {
					const lc = map.getPaintProperty(
						outlineLayerId,
						"line-color",
					) as unknown;
					if (typeof lc === "string" && lc.trim()) outlineColor = lc;
				}
			}

			if (fillColor) {
				out.push({
					label: toc.title,
					swatch: {
						kind: "polygon",
						value: { fill: fillColor, outline: outlineColor },
					},
				});
			}
			continue;
		}

		if (layer.type === "line") {
			// ✅ Outline-Layer nicht als eigene Legendenzeile anzeigen,
			// wenn wir im gleichen TOC-Item bereits ein Fill-Layer hatten
			if (outlineIdsToSkip.has(layerId)) continue;

			const line = map.getPaintProperty(layerId, "line-color") as unknown;
			out.push(...extractLegendFromPaint("line", line, toc.title));
			continue;
		}

		if (layer.type === "circle") {
			const circle = map.getPaintProperty(layerId, "circle-color") as unknown;
			out.push(...extractLegendFromPaint("circle", circle, "Punkt"));
		}
	}

	return dedupeLegend(out);
}

function LegendList({ map }: { map: maplibregl.Map | null }) {
	const visible = useTocStore((s) => s.visible);
	const [sections, setSections] = useState<LegendSection[]>([]);

	useEffect(() => {
		if (!map) {
			setSections([]);
			return;
		}

		const rebuild = () => {
			if (!map.isStyleLoaded()) {
				setSections([]);
				return;
			}

			const tocItems = MAP_CONFIG.tocItems as TocItemConfig[];

			const next = tocItems
				.filter((i) => {
					const id = i.id as TocItemId;
					const isVisible = (visible[id] ?? i.defaultVisible) === true;
					return isVisible && (i.layerIds?.length ?? 0) > 0;
				})
				.map((i) => ({ item: i, legend: buildLegendForTocItem(map, i) }))
				.filter((x) => x.legend.length > 0);

			setSections(next);
		};

		rebuild();

		map.on("style.load", rebuild);
		map.on("idle", rebuild);

		return () => {
			map.off("style.load", rebuild);
			map.off("idle", rebuild);
		};
	}, [map, visible]);

	if (sections.length === 0) {
		return (
			<div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
				Keine sichtbaren Layer mit Legende.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{sections.map(({ item, legend }, idx) => (
				<div key={item.id} className="space-y-2">
					<div className="flex items-center justify-between gap-2">
						<div className="text-xs font-medium">{item.title}</div>
						<div className="text-[11px] text-muted-foreground">
							{legend.length}
						</div>
					</div>

					<div className="grid gap-1.5">
						{legend.map((li) => (
							<div
								key={`${item.id}-${li.label}-${swatchKey(li.swatch)}`}
								className="flex items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-muted/50"
							>
								<Swatch {...li.swatch} />

								<span className="min-w-0 truncate text-muted-foreground">
									{li.label}
								</span>
							</div>
						))}
					</div>

					{idx < sections.length - 1 && <Separator />}
				</div>
			))}
		</div>
	);
}

export function LegendPanel({
	map,
	variant = "sidebar",
	className,
}: {
	map: maplibregl.Map | null;
	variant?: LegendPanelVariant;
	className?: string;
}) {
	const isMobile = useIsMobile();

	if (variant === "sidebar") {
		return (
			<div className={cn("w-full", className)}>
				<ScrollArea className="max-h-[45vh] pr-2">
					<LegendList map={map} />
				</ScrollArea>
			</div>
		);
	}

	if (isMobile) {
		return (
			<div className={cn("absolute right-3 top-3 z-50", className)}>
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="secondary" size="sm" className="gap-2 shadow">
							<List className="h-4 w-4" />
							Legende
						</Button>
					</SheetTrigger>

					<SheetContent side="right" className="w-85">
						<SheetHeader>
							<SheetTitle>Legende</SheetTitle>
						</SheetHeader>

						<div className="mt-4">
							<ScrollArea className="h-[calc(100vh-7rem)] pr-3">
								<LegendList map={map} />
							</ScrollArea>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		);
	}

	return (
		<div className={cn("absolute right-3 top-3 z-50 w-80", className)}>
			<Card className="shadow">
				<CardHeader className="py-3">
					<CardTitle className="text-sm">Legende</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<ScrollArea className="max-h-[55vh] pr-3">
						<LegendList map={map} />
					</ScrollArea>
				</CardContent>
			</Card>
		</div>
	);
}

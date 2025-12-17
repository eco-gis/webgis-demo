"use client";

import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { ScrollArea } from "@/app/components/ui/scroll-area";
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
	TocLegendItem,
} from "@/app/map/features/toc/toc-types";
import { AlertCircle, Image as ImageIcon, List } from "lucide-react";
import type maplibregl from "maplibre-gl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

// --- Extended Types (No more 'any') ---

interface ExtendedTocItem extends TocItemConfig {
	legendItems?: readonly TocLegendItem[];
	legendUrl?: string;
}

type LegendPaintKind = "fill" | "line" | "circle" | "symbol";
type PolygonSwatchValue = { fill: string; outline: string | null };

type LegendItem = {
	label: string;
	swatch:
		| { kind: "circle" | "symbol"; value: string }
		| { kind: "fill" | "line"; value: string }
		| { kind: "polygon"; value: PolygonSwatchValue };
};

type VectorSection = {
	kind: "vector";
	item: ExtendedTocItem;
	legend: LegendItem[];
};
type ImageSection = { kind: "image"; item: ExtendedTocItem; url: string };
type LegendSection = VectorSection | ImageSection;

type LegendPanelVariant = "sidebar" | "floating";
type Expr = readonly unknown[];

// --- Type Guards ---

function isNonEmptyString(x: unknown): x is string {
	return typeof x === "string" && x.trim().length > 0;
}

function isVectorSection(s: LegendSection): s is VectorSection {
	return s.kind === "vector";
}

// --- Helpers ---

function swatchKey(sw: LegendItem["swatch"]): string {
	if (sw.kind === "polygon")
		return `poly-${sw.value.fill}-${sw.value.outline ?? "none"}`;
	return `${sw.kind}-${sw.value}`;
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

function getPaintValue(
	map: maplibregl.Map,
	layerId: string,
	prop: string,
): unknown {
	if (!map.getLayer(layerId)) return null;
	return map.getPaintProperty(layerId, prop);
}

// --- UI Components ---

function Swatch({ swatch }: { swatch: LegendItem["swatch"] }) {
	if (swatch.kind === "circle" || swatch.kind === "symbol") {
		return (
			<div className="flex h-5 w-5 shrink-0 items-center justify-center">
				<span
					className="h-3 w-3 rounded-full border border-border/40"
					style={{ backgroundColor: swatch.value }}
				/>
			</div>
		);
	}
	if (swatch.kind === "line") {
		return (
			<div className="flex h-5 w-5 shrink-0 items-center justify-center">
				<span
					className="h-1 w-4 rounded-full"
					style={{ backgroundColor: swatch.value }}
				/>
			</div>
		);
	}
	if (swatch.kind === "polygon") {
		return (
			<div className="relative h-5 w-5 shrink-0 overflow-hidden rounded border border-border/30">
				<span
					className="absolute inset-0"
					style={{ backgroundColor: swatch.value.fill, opacity: 0.8 }}
				/>
				{swatch.value.outline && (
					<span
						className="absolute inset-0 border-[1.5px]"
						style={{ borderColor: swatch.value.outline }}
					/>
				)}
			</div>
		);
	}
	return null;
}

function WmsLegendDisplay({ url, title }: { url: string; title: string }) {
	const [error, setError] = useState(false);
	const [retryCount, setRetryCount] = useState(0);

	const handleError = () => {
		// Fallback für Swisstopo Suffixe
		if (url.includes(".fill_de") && retryCount === 0) {
			setRetryCount(1);
			return;
		}
		setError(true);
	};

	const currentUrl = retryCount === 1 ? url.replace(".fill_de", ".de") : url;

	if (error) {
		return (
			<div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
				<AlertCircle className="h-3 w-3" />
				<span>Fehler bei {title}</span>
			</div>
		);
	}

	return (
		<div className="group relative mt-1 overflow-hidden rounded-md border bg-white/50 p-1 transition-colors hover:bg-white/80">
			<div className="relative min-h-8 w-full">
				<Image
					src={currentUrl}
					alt={title}
					unoptimized
					width={500}
					height={500}
					// mix-blend-multiply macht weiße Hintergründe transparent
					className="h-auto w-auto max-w-full object-contain mix-blend-multiply"
					onError={handleError}
				/>
			</div>
		</div>
	);
}

// --- Logic ---

function makeSimple(
	kind: LegendPaintKind,
	label: string,
	color: string,
): LegendItem {
	return { label, swatch: { kind, value: color } };
}

function extractLegendFromPaint(
	kind: LegendPaintKind,
	paintValue: unknown,
	labelFallback: string,
): LegendItem[] {
	if (isNonEmptyString(paintValue))
		return [makeSimple(kind, labelFallback, paintValue)];
	if (!Array.isArray(paintValue) || typeof paintValue[0] !== "string")
		return [];

	const expr = paintValue as Expr;
	const op = expr[0] as string;

	if (op === "step") {
		const out: LegendItem[] = [];
		const base = expr[2];
		const first = expr[3];
		if (isNonEmptyString(base) && first !== undefined) {
			out.push(makeSimple(kind, `${labelFallback}: < ${String(first)}`, base));
		}
		for (let i = 3; i + 1 < expr.length; i += 2) {
			const stop = expr[i];
			const col = expr[i + 1];
			if (isNonEmptyString(col))
				out.push(makeSimple(kind, `${labelFallback}: ≥ ${String(stop)}`, col));
		}
		return out;
	}

	if (op === "match") {
		const out: LegendItem[] = [];
		for (let i = 2; i + 1 < expr.length - 1; i += 2) {
			const key = expr[i];
			const col = expr[i + 1];
			if (isNonEmptyString(col)) out.push(makeSimple(kind, String(key), col));
		}
		const def = expr[expr.length - 1];
		if (isNonEmptyString(def))
			out.push(makeSimple(kind, `${labelFallback}: sonst`, def));
		return out;
	}

	if (op === "interpolate") {
		const out: LegendItem[] = [];
		for (let i = 3; i + 1 < expr.length; i += 2) {
			const stop = expr[i];
			const col = expr[i + 1];
			if (isNonEmptyString(col))
				out.push(makeSimple(kind, `${labelFallback}: ${String(stop)}`, col));
		}
		return out;
	}

	return [];
}

function buildLegendForTocItem(
	map: maplibregl.Map,
	toc: ExtendedTocItem,
): LegendItem[] {
	const ids = toc.mapLayerIds || [];
	const fillId = ids.find((id) => map.getLayer(id)?.type === "fill");
	const lineId = ids.find((id) => map.getLayer(id)?.type === "line");
	const circleId = ids.find((id) => map.getLayer(id)?.type === "circle");

	if (fillId) {
		const fillPaint = getPaintValue(map, fillId, "fill-color");
		const fillLegend = extractLegendFromPaint("fill", fillPaint, toc.title);

		if (fillLegend.length === 1 && fillLegend[0].swatch.kind === "fill") {
			const outline = lineId ? getPaintValue(map, lineId, "line-color") : null;
			return [
				{
					label: toc.title,
					swatch: {
						kind: "polygon",
						value: {
							fill: fillLegend[0].swatch.value,
							outline: isNonEmptyString(outline) ? outline : null,
						},
					},
				},
			];
		}
		return dedupeLegend(fillLegend);
	}

	if (lineId) {
		return dedupeLegend(
			extractLegendFromPaint(
				"line",
				getPaintValue(map, lineId, "line-color"),
				toc.title,
			),
		);
	}

	if (circleId) {
		return dedupeLegend(
			extractLegendFromPaint(
				"circle",
				getPaintValue(map, circleId, "circle-color"),
				toc.title,
			),
		);
	}

	return [];
}

// --- Main Components ---

function LegendList({ map }: { map: maplibregl.Map | null }) {
	const visible = useTocStore((s) => s.visible);
	const dynamicItems = useTocStore((s) => s.dynamicItems) as ExtendedTocItem[];
	const [sections, setSections] = useState<LegendSection[]>([]);

	const allItems = useMemo(
		() => [...(MAP_CONFIG.tocItems as ExtendedTocItem[]), ...dynamicItems],
		[dynamicItems],
	);

	useEffect(() => {
		if (!map) return;

		const rebuild = () => {
			const next: LegendSection[] = [];

			// SCHLEIFE ÜBER ALLE ITEMS
			for (const item of allItems) {
				if (!visible[item.id]) continue;

				if (item.legendItems && item.legendItems.length > 0) {
					// 1. Manuelle LegendItems (Vektor)
					next.push({
						kind: "vector",
						item,
						legend: item.legendItems.map((li) => ({
							label: li.label,
							swatch: li.swatch as LegendItem["swatch"],
						})),
					});
					continue; // Weiter zum nächsten Item
				}

				if (item.legendUrl) {
					// 2. WMS Legenden (Bild)
					next.push({ kind: "image", item, url: item.legendUrl });
					continue; // Weiter zum nächsten Item
				}

				// 3. Automatische Vektor-Extraktion
				const vectorItems = buildLegendForTocItem(map, item);
				if (vectorItems.length > 0) {
					next.push({ kind: "vector", item, legend: vectorItems });
				}
			} // ENDE DER SCHLEIFE

			// --- GRUPPIERUNG (NACH DER SCHLEIFE) ---
			const grouped: LegendSection[] = [];

			next.forEach((sec) => {
				const last = grouped[grouped.length - 1];

				// Prüfen, ob wir dieses Element mit dem vorherigen mergen können
				const canGroup =
					last &&
					last.kind === "vector" &&
					sec.kind === "vector" &&
					last.item.title === sec.item.title;

				if (canGroup) {
					// Merge legend arrays und dedupe
					(last as VectorSection).legend = dedupeLegend([
						...(last as VectorSection).legend,
						...(sec as VectorSection).legend,
					]);
				} else {
					grouped.push(sec);
				}
			});

			setSections(grouped);
		};

		rebuild();
		map.on("styledata", rebuild);
		return () => {
			map.off("styledata", rebuild);
		};
	}, [map, allItems, visible]);

	if (!sections.length)
		return (
			<div className="flex h-32 flex-col items-center justify-center space-y-2 text-muted-foreground/60">
				<ImageIcon className="h-8 w-8 stroke-1" />
				<p className="text-xs">Keine aktiven Ebenen</p>
			</div>
		);

	return (
		<div className="space-y-4">
			{sections.map((sec, idx) => {
				const isSingleEntry = sec.kind === "vector" && sec.legend.length === 1;
				const showHeader =
					!isSingleEntry || sec.legend[0].label !== sec.item.title;

				// Unique Key generieren (Fallback auf Index, falls ID doppelt vorkommt)
				const uniqueKey = `${sec.item.id}-${idx}`;

				return (
					<div key={uniqueKey} className="flex flex-col gap-1.5">
						{showHeader && (
							<h4 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground/80">
								{sec.item.title}
							</h4>
						)}

						{isVectorSection(sec) ? (
							<div className="space-y-1">
								{sec.legend.map((li) => (
									<div
										key={`${uniqueKey}-${li.label}-${swatchKey(li.swatch)}`}
										className="flex items-center gap-3 py-0.5"
									>
										<Swatch swatch={li.swatch} />
										<span className="text-[13px] leading-tight text-foreground/90">
											{li.label}
										</span>
									</div>
								))}
							</div>
						) : (
							<WmsLegendDisplay url={sec.url} title={sec.item.title} />
						)}
					</div>
				);
			})}
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
	const content = (
		<ScrollArea
			className={variant === "sidebar" ? "h-full" : "h-[45vh] max-h-150"}
		>
			<div className="p-4 pt-2">
				<LegendList map={map} />
			</div>
		</ScrollArea>
	);

	if (variant === "sidebar")
		return <div className={cn("h-full", className)}>{content}</div>;

	if (isMobile) {
		return (
			<Sheet>
				<SheetTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="fixed bottom-20 right-4 z-50 h-10 w-10 rounded-full bg-background p-0 shadow-lg"
					>
						<List className="h-5 w-5" />
					</Button>
				</SheetTrigger>
				<SheetContent side="bottom" className="rounded-t-xl h-[70vh]">
					<SheetHeader className="border-b pb-4">
						<SheetTitle>Legende</SheetTitle>
					</SheetHeader>
					{content}
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Card
			className={cn(
				"fixed right-4 top-20 z-40 w-72 border-border/40 shadow-2xl backdrop-blur-md",
				className,
			)}
		>
			<CardHeader className="border-b bg-muted/20 py-3 px-4">
				<CardTitle className="flex items-center gap-2 text-sm font-bold">
					<List className="h-4 w-4" /> Legende
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">{content}</CardContent>
		</Card>
	);
}

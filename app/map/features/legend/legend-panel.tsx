"use client";

import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/app/components/ui/popover";
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
import DOMPurify from "dompurify";
import {
	AlertCircle,
	ExternalLink,
	ImageIcon,
	Info,
	List,
	Loader2,
} from "lucide-react";
import type maplibregl from "maplibre-gl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

// --- Types ---
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

// --- Helpers ---
function isNonEmptyString(x: unknown): x is string {
	return typeof x === "string" && x.trim().length > 0;
}

function isVectorSection(s: LegendSection): s is VectorSection {
	return s.kind === "vector";
}

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
			<div className="flex h-4 w-4 shrink-0 items-center justify-center">
				<span
					className="h-2.5 w-2.5 rounded-full border border-border/40 shadow-sm"
					style={{ backgroundColor: swatch.value }}
				/>
			</div>
		);
	}
	if (swatch.kind === "line") {
		return (
			<div className="flex h-4 w-4 shrink-0 items-center justify-center">
				<span
					className="h-1 w-3.5 rounded-full"
					style={{ backgroundColor: swatch.value }}
				/>
			</div>
		);
	}
	if (swatch.kind === "polygon") {
		return (
			<div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-[2px] border border-border/30 shadow-sm">
				<span
					className="absolute inset-0"
					style={{ backgroundColor: swatch.value.fill }}
				/>
				{swatch.value.outline && (
					<span
						className="absolute inset-0 border"
						style={{ borderColor: swatch.value.outline }}
					/>
				)}
			</div>
		);
	}
	return null;
}

function WmsLegendDisplay({ url, title }: { url: string; title: string }) {
	const [htmlContent, setHtmlContent] = useState<string | null>(null);
	const [legendImage, setLegendImage] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const sanitizedHtml = useMemo(() => {
		if (!htmlContent) return "";
		return DOMPurify.sanitize(htmlContent, {
			ADD_ATTR: ["target"],
		});
	}, [htmlContent]);

	const isSwisstopoRest =
		url.includes("geo.admin.ch") && url.includes("/legend");

	useEffect(() => {
		if (!isSwisstopoRest) {
			setLegendImage(url);
			setLoading(false);
			return;
		}

		async function fetchLegend() {
			try {
				const response = await fetch(url);
				const text = await response.text();
				const parser = new DOMParser();
				const doc = parser.parseFromString(text, "text/html");

				// Extrahiere das Bild
				const img = doc.querySelector(".img-container img") as HTMLImageElement;
				if (img) {
					const src = img.getAttribute("src") || "";
					setLegendImage(src.startsWith("http") ? src : `https:${src}`);
				}

				// Extrahiere Metadaten für Popover
				const abstract = doc.querySelector(".legend-abstract")?.outerHTML || "";
				const table = doc.querySelector("table")?.outerHTML || "";
				setHtmlContent(
					`${abstract}<div class="mt-4 overflow-x-auto">${table}</div>`,
				);
			} catch (err) {
				console.error("Legend Fetch Error:", err);
				setError(true);
			} finally {
				setLoading(false);
			}
		}

		fetchLegend();
	}, [url, isSwisstopoRest]);

	if (loading)
		return (
			<div className="flex p-4">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			</div>
		);

	if (error || !legendImage) {
		return (
			<div className="text-[10px] text-destructive flex items-center gap-1 p-2 bg-destructive/5 rounded border border-destructive/10">
				<AlertCircle className="h-3 w-3" /> Legende nicht verfügbar
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{/* Bild-Anzeige (Sidebar) */}
			<div className="rounded-lg border border-border/40 bg-white/50 p-2 dark:bg-muted/10">
				<Image
					src={legendImage}
					alt={title}
					width={300}
					height={200}
					className="h-auto w-auto max-w-full mix-blend-multiply"
					onError={() => setError(true)}
					unoptimized
				/>
			</div>

			{/* Info-Button nur bei Swisstopo REST */}
			{isSwisstopoRest && (
				<div className="flex items-center justify-between px-1">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 gap-1.5 px-2 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5"
							>
								<Info className="h-3.5 w-3.5" />
								Details
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-80 text-[12px] p-4 shadow-2xl"
							side="right"
						>
							<div className="space-y-3 max-h-96 overflow-y-auto custom-legend-html">
								<h3 className="font-bold text-sm border-b pb-2">{title}</h3>
								<div
									className="space-y-3 custom-legend-html"
									// biome-ignore lint/security/noDangerouslySetInnerHtml: <Swisstopo HTML is trusted and fetched server-side>
									dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
								/>
							</div>
						</PopoverContent>
					</Popover>
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						className="text-muted-foreground/30 hover:text-primary"
					>
						<ExternalLink className="h-3 w-3" />
					</a>
				</div>
			)}
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
		if (isNonEmptyString(base) && first !== undefined)
			out.push(makeSimple(kind, `< ${String(first)}`, base));
		for (let i = 3; i + 1 < expr.length; i += 2) {
			const stop = expr[i];
			const col = expr[i + 1];
			if (isNonEmptyString(col))
				out.push(makeSimple(kind, `≥ ${String(stop)}`, col));
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
		if (isNonEmptyString(def)) out.push(makeSimple(kind, "Sonst", def));
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
	if (lineId)
		return dedupeLegend(
			extractLegendFromPaint(
				"line",
				getPaintValue(map, lineId, "line-color"),
				toc.title,
			),
		);
	if (circleId)
		return dedupeLegend(
			extractLegendFromPaint(
				"circle",
				getPaintValue(map, circleId, "circle-color"),
				toc.title,
			),
		);
	return [];
}

// --- Main Legend List ---
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
			for (const item of allItems) {
				if (!visible[item.id]) continue;
				if (item.legendItems && item.legendItems.length > 0) {
					next.push({
						kind: "vector",
						item,
						legend: item.legendItems.map((li) => ({
							label: li.label,
							swatch: li.swatch as LegendItem["swatch"],
						})),
					});
					continue;
				}
				if (item.legendUrl) {
					next.push({ kind: "image", item, url: item.legendUrl });
					continue;
				}
				const vectorItems = buildLegendForTocItem(map, item);
				if (vectorItems.length > 0)
					next.push({ kind: "vector", item, legend: vectorItems });
			}
			const grouped: LegendSection[] = [];
			for (const sec of next) {
				const last = grouped[grouped.length - 1];
				if (
					last &&
					last.kind === "vector" &&
					sec.kind === "vector" &&
					last.item.title === sec.item.title
				) {
					(last as VectorSection).legend = dedupeLegend([
						...(last as VectorSection).legend,
						...(sec as VectorSection).legend,
					]);
				} else grouped.push(sec);
			}
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
			<div className="flex h-40 flex-col items-center justify-center space-y-3 text-muted-foreground/40 animate-in fade-in duration-500">
				<ImageIcon className="h-10 w-10 stroke-1" />
				<p className="text-[11px] font-medium tracking-wide uppercase">
					Keine aktiven Ebenen
				</p>
			</div>
		);

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
			{sections.map((sec, idx) => {
				const isSingleEntry = sec.kind === "vector" && sec.legend.length === 1;
				const showHeader =
					!isSingleEntry || sec.legend[0].label !== sec.item.title;
				return (
					<div key={`${sec.item.id}-${idx}`} className="flex flex-col gap-2">
						{showHeader && (
							<h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 border-b pb-1 mb-1">
								{sec.item.title}
							</h4>
						)}
						{isVectorSection(sec) ? (
							<div className="space-y-1.5 px-0.5">
								{sec.legend.map((li) => (
									<div
										key={`${li.label}-${swatchKey(li.swatch)}`}
										className="flex items-center gap-3 py-0.5 group"
									>
										<Swatch swatch={li.swatch} />
										<span className="text-[12px] leading-tight text-foreground/80 group-hover:text-foreground transition-colors">
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
	if (variant === "sidebar")
		return (
			<div className={cn("w-full h-auto", className)}>
				<LegendList map={map} />
			</div>
		);
	const floatingContent = (
		<ScrollArea className="h-[50vh] max-h-150 w-full">
			<div className="p-5">
				<LegendList map={map} />
			</div>
		</ScrollArea>
	);
	if (isMobile)
		return (
			<Sheet>
				<SheetTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="fixed bottom-24 right-4 z-50 h-12 w-12 rounded-2xl bg-background shadow-xl border-primary/20 p-0 text-primary"
					>
						<List className="h-6 w-6" />
					</Button>
				</SheetTrigger>
				<SheetContent
					side="bottom"
					className="rounded-t-4xl h-[75vh] px-0 pb-10 border-t-2 border-primary/10"
				>
					<SheetHeader className="px-6 border-b pb-4">
						<SheetTitle className="text-left text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
							<List className="h-4 w-4" /> Legende
						</SheetTitle>
					</SheetHeader>
					{floatingContent}
				</SheetContent>
			</Sheet>
		);
	return (
		<Card
			className={cn(
				"fixed right-6 top-24 z-40 w-80 border-border/40 shadow-2xl backdrop-blur-xl bg-background/95 rounded-2xl overflow-hidden",
				className,
			)}
		>
			<CardHeader className="border-b bg-muted/30 py-3.5 px-5">
				<CardTitle className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
					<List className="h-4 w-4 text-primary" /> Legende
				</CardTitle>
			</CardHeader>
			<CardContent className="p-0">{floatingContent}</CardContent>
		</Card>
	);
}

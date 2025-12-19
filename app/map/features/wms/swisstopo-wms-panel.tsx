"use client";

import {
	Check,
	ChevronsUpDown,
	Loader2,
	Search,
	Trash2,
	X,
} from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/app/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/app/components/ui/popover";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/app/components/ui/tooltip";

import { cn } from "@/app/lib/utils";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import type { TocItemId } from "@/app/map/features/toc/toc-types";

import {
	loadSwisstopoCatalog,
	type SwisstopoLayerConfig,
} from "./swisstopo-catalog";
import { toTocItem } from "./wms-from-url";
import { removeWmsLayer, upsertWmsLayer } from "./wms-maplibre";
import type { WmsUrlConfig, WmsUrlId } from "./wms-types";

type Props = {
	map: MapLibreMap | null;
};

function makeInternalId(id: string, isWmts: boolean): WmsUrlId {
	const prefix = isWmts ? "wmts" : "wms";
	return `${prefix}:${id}` as const;
}

export function SwisstopoWmsPanel({ map }: Props) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [catalog, setCatalog] = useState<SwisstopoLayerConfig[]>([]);

	const registerDynamicItem = useTocStore((s) => s.registerDynamicItem);
	const unregisterDynamicItem = useTocStore((s) => s.unregisterDynamicItem);
	const dynamicItems = useTocStore((s) => s.dynamicItems);

	const activeItems = useMemo(
		() =>
			dynamicItems.filter(
				(it) =>
					String(it.id).startsWith("wms:ch.swisstopo") ||
					String(it.id).startsWith("wmts:ch.swisstopo"),
			),
		[dynamicItems],
	);

	useEffect(() => {
		let cancelled = false;
		async function fetchCatalog() {
			setLoading(true);
			setError(null);
			try {
				const items = await loadSwisstopoCatalog();
				if (!cancelled) setCatalog(items);
			} catch {
				if (!cancelled) setError("Katalog konnte nicht geladen werden.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		fetchCatalog();
		return () => {
			cancelled = true;
		};
	}, []);

	function handleToggleLayer(layer: SwisstopoLayerConfig) {
		if (!map) return;
		const internalId = makeInternalId(layer.id, layer.isWmts);
		const isActive = activeItems.some((it) => it.id === internalId);

		if (isActive) {
			removeLayer(internalId);
		} else {
			addLayer(layer);
		}
	}

	function addLayer(layer: SwisstopoLayerConfig): void {
		if (!map) return;
		const internalId = makeInternalId(layer.id, layer.isWmts);
		const cfg: WmsUrlConfig = {
			id: internalId,
			title: layer.title,
			baseUrl: layer.isWmts
				? `https://wmts.geo.admin.ch/1.0.0/${layer.id}/default/current/3857/{z}/{x}/{y}.${layer.format.split("/")[1] || layer.format}`
				: "https://wms.geo.admin.ch/",
			layers: layer.id,
			format: layer.format.includes("jpeg") ? "image/jpeg" : "image/png",
			transparent: true,
			opacity: 1,
		};

		upsertWmsLayer(map, cfg);
		registerDynamicItem(toTocItem(cfg));
	}

	function removeLayer(id: TocItemId): void {
		if (!map) return;
		removeWmsLayer(map, String(id));
		unregisterDynamicItem(id);
	}

	function clearAllLayers() {
		if (!map) return;
		for (const item of activeItems) {
			removeLayer(item.id);
		}
	}

	const disabled = !map || loading;

	return (
		<div className="flex flex-col gap-3 font-sans">
			<header className="flex items-center justify-between px-0.5">
				<h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
					Swisstopo Katalog
				</h3>
				{activeItems.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearAllLayers}
						className="h-5 px-1.5 text-[10px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
					>
						<Trash2 className="mr-1 h-3 w-3" />
						Alle leeren
					</Button>
				)}
			</header>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							"w-full justify-between bg-background px-3 text-sm font-normal transition-all",
							"hover:border-primary/50 focus:ring-2 focus:ring-primary/20",
							error && "border-destructive/50",
						)}
					>
						<div className="flex items-center gap-2.5 truncate">
							{loading ? (
								<Loader2 className="h-4 w-4 animate-spin text-primary" />
							) : (
								<Search className="h-4 w-4 text-primary/70" />
							)}
							<span className="truncate">
								{loading ? "Katalog laden..." : "Ebenen hinzufügen..."}
							</span>
						</div>
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40 text-secondary" />
					</Button>
				</PopoverTrigger>

				<PopoverContent
					className="w-[--radix-popover-trigger-width] p-0 shadow-xl border-border"
					align="start"
					sideOffset={4}
				>
					<Command className="rounded-lg">
						<CommandInput placeholder="Suchen..." className="h-10 text-sm" />
						<CommandList>
							<CommandEmpty className="py-6 text-center text-xs text-muted-foreground font-sans">
								Keine Layer gefunden.
							</CommandEmpty>
							<CommandGroup title="Verfügbare Karten">
								<ScrollArea className="h-80 pr-1">
									{catalog.map((layer) => {
										const internalId = makeInternalId(layer.id, layer.isWmts);
										const isActive = activeItems.some(
											(it) => it.id === internalId,
										);

										return (
											<CommandItem
												key={layer.id}
												value={layer.title}
												onSelect={() => handleToggleLayer(layer)}
												className="group flex cursor-pointer items-start gap-3 px-3 py-3 data-[selected=true]:bg-primary/5 transition-colors"
											>
												{/* OPTIMIERTE CHECKBOX: Orange Umrandung & Oranger Haken */}
												<div
													className={cn(
														"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200",
														isActive
															? "border-primary bg-primary/10" // Orange Rand, ganz zarter Hintergrund
															: "border-input bg-background group-hover:border-primary/50",
													)}
												>
													{isActive && (
														<Check className="h-3 w-3 stroke-[3.5] text-primary" />
													)}
												</div>

												<div className="flex flex-col gap-0.5 text-left">
													<span
														className={cn(
															"text-[13px] leading-snug transition-colors",
															isActive
																? "font-semibold text-foreground"
																: "text-foreground group-hover:text-primary",
														)}
													>
														{layer.title}
													</span>
													<span className="text-[10px] font-medium uppercase tracking-tighter text-muted-foreground/60">
														{layer.isWmts ? "WMTS Kachel" : "WMS Service"}
													</span>
												</div>
											</CommandItem>
										);
									})}
								</ScrollArea>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{error && (
				<div className="flex items-center gap-2 text-[11px] text-destructive bg-destructive/5 px-2 py-1.5 rounded border border-destructive/20 animate-in fade-in">
					<X className="h-3 w-3" />
					{error}
				</div>
			)}

			{activeItems.length > 0 && (
				<div className="flex flex-wrap gap-1.5 pt-1">
					<TooltipProvider delayDuration={200}>
						{activeItems.map((it) => (
							<Badge
								key={String(it.id)}
								variant="secondary"
								className={cn(
									"group h-7 animate-in fade-in zoom-in-95 items-center gap-1.5 border-transparent",
									"bg-secondary text-secondary-foreground pl-2.5 pr-1 text-[11px] font-medium",
									"hover:bg-secondary/90 transition-all shadow-sm",
								)}
							>
								<span className="max-w-35 truncate leading-none">
									{it.title}
								</span>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={() => removeLayer(it.id)}
											aria-label={`${it.title} entfernen`}
											className="rounded-full p-0.5 transition-colors hover:bg-destructive hover:text-destructive-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
										>
											<X className="h-3 w-3" />
										</button>
									</TooltipTrigger>
									<TooltipContent
										side="bottom"
										className="text-[10px] bg-foreground text-background"
									>
										Ebene entfernen
									</TooltipContent>
								</Tooltip>
							</Badge>
						))}
					</TooltipProvider>
				</div>
			)}
		</div>
	);
}
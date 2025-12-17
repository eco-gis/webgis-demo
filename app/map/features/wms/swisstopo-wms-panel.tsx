"use client";

import { Check, ChevronsUpDown, Trash2, X } from "lucide-react";
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

import { cn } from "@/app/lib/utils";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import type { TocItemId } from "@/app/map/features/toc/toc-types";

import { loadSwisstopoWmsCatalog } from "./swisstopo-wms-catalog";
import { toTocItem } from "./wms-from-url";
import { removeWmsLayer, upsertWmsLayer } from "./wms-maplibre";
import type { WmsUrlConfig } from "./wms-types";

type Props = {
	map: MapLibreMap | null;
};

type CatalogItem = {
	name: string;
	title: string;
};

function makeWmsId(name: string): `wms:${string}` {
	const safe = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 80);

	return `wms:swisstopo_${safe}` as const;
}

export function SwisstopoWmsPanel({ map }: Props) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [catalog, setCatalog] = useState<CatalogItem[]>([]);

	const registerDynamicItem = useTocStore((s) => s.registerDynamicItem);
	const unregisterDynamicItem = useTocStore((s) => s.unregisterDynamicItem);
	const dynamicItems = useTocStore((s) => s.dynamicItems);

	const activeItems = useMemo(
		() =>
			dynamicItems.filter((it) =>
				String(it.id).startsWith("wms:swisstopo_"),
			),
		[dynamicItems],
	);

	const options = useMemo(
		() => catalog.filter((l) => l.name.startsWith("ch.swisstopo.")),
		[catalog],
	);

	const titleByName = useMemo(() => {
		const map = new Map<string, string>();
		for (const o of options) map.set(o.name, o.title);
		return map;
	}, [options]);

	useEffect(() => {
		let cancelled = false;

		setLoading(true);
		setError(null);

		loadSwisstopoWmsCatalog()
			.then((items) => {
				if (cancelled) return;
				setCatalog(items.map(({ name, title }) => ({ name, title })));
			})
			.catch((e) => {
				if (cancelled) return;
				setError(e instanceof Error ? e.message : "Katalog konnte nicht geladen werden");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	function addLayer(layerName: string): void {
		if (!map) return;

		const cfg: WmsUrlConfig = {
			id: makeWmsId(layerName),
			title: titleByName.get(layerName) ?? layerName,
			baseUrl: "https://wms.geo.admin.ch/",
			layers: layerName,
			format: "image/png",
			transparent: true,
			opacity: 1,
		};

		upsertWmsLayer(map, cfg);
		registerDynamicItem(toTocItem(cfg));
		setOpen(false);
	}

	function removeLayer(id: TocItemId): void {
		if (!map) return;
		removeWmsLayer(map, String(id));
		unregisterDynamicItem(id);
	}

	function clearAll(): void {
		if (!map) return;
		for (const it of activeItems) {
			removeWmsLayer(map, String(it.id));
			unregisterDynamicItem(it.id);
		}
	}

	const disabled = !map || loading;

	return (
		<div className="space-y-2">
			<div className="text-[11px] font-medium text-muted-foreground">
				Swisstopo WMS
			</div>

			{error && (
				<div className="rounded-sm bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
					{error}
				</div>
			)}

			{activeItems.length > 0 && (
				<div className="rounded-md border bg-muted/20 p-2">
					<div className="mb-1 flex items-center justify-between">
						<span className="text-[11px] text-muted-foreground">
							Aktiv
						</span>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 px-1 text-[11px]"
							onClick={clearAll}
							disabled={disabled}
						>
							<Trash2 className="mr-1 h-3 w-3" />
							Leeren
						</Button>
					</div>

					<div className="flex flex-wrap gap-1">
						{activeItems.map((it) => (
							<Badge
								key={String(it.id)}
								variant="secondary"
								className="h-5 gap-1 px-1.5 text-[11px]"
							>
								<span className="max-w-40 truncate">{it.title}</span>
								<button
									type="button"
									onClick={() => removeLayer(it.id)}
									className="opacity-60 hover:opacity-100"
								>
									<X className="h-3 w-3" />
								</button>
							</Badge>
						))}
					</div>
				</div>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						disabled={disabled}
						className={cn(
							"flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[12px]",
							"bg-background hover:bg-muted/30",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
							"disabled:opacity-60",
						)}
					>
						<span>Layer hinzufügen</span>
						<ChevronsUpDown className="h-4 w-4 opacity-60" />
					</button>
				</PopoverTrigger>

				<PopoverContent
					align="start"
					className="w-(--radix-popover-trigger-width) p-0"
				>
					<Command>
						<CommandInput
							placeholder="Suchen…"
							className="h-8 text-xs"
						/>
						<CommandList className="max-h-[40vh]">
							<CommandEmpty className="py-2 text-xs">
								Keine Treffer
							</CommandEmpty>

							<CommandGroup heading="Swisstopo" className="text-[10px]">
								{options.map((opt) => (
									<CommandItem
										key={opt.name}
										value={opt.name}
										onSelect={() => addLayer(opt.name)}
										className="py-1.5"
									>
										<Check className="mr-2 h-3.5 w-3.5 opacity-0" />
										<span className="truncate text-xs">
											{opt.title}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{!map && (
				<div className="text-[10px] text-muted-foreground">
					Karte noch nicht bereit
				</div>
			)}
		</div>
	);
}

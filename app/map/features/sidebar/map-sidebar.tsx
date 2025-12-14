"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Separator } from "@/app/components/ui/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
} from "@/app/components/ui/sidebar";
import { Slider } from "@/app/components/ui/slider";
import { BasemapGallery } from "@/app/map/basemaps/basemap-gallery";
import { useBasemapStore } from "@/app/map/basemaps/basemap-store";
import { useBasemapSync } from "@/app/map/basemaps/use-basemap-sync";
import { SearchPanel } from "@/app/map/features/search/search-panel";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import { MAP_CONFIG } from "@/app/map/map-config";
import { Blend, Layers, Map as MapIcon, Search, Tag } from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

function LegendSwatch({
	kind,
	value,
}: {
	kind: "fill" | "line" | "circle";
	value: string;
}) {
	if (kind === "circle") {
		return (
			<span
				className="h-3 w-3 rounded-full"
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
			className="h-3 w-6 rounded-sm"
			style={{ backgroundColor: value, opacity: 0.6 }}
		/>
	);
}

function TocPanel() {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const setVisible = useTocStore((s) => s.setVisible);
	const setLabelsVisible = useTocStore((s) => s.setLabelsVisible);
	const setOpacity = useTocStore((s) => s.setOpacity);

	return (
		<div className="space-y-2">
			{MAP_CONFIG.tocItems.map((item) => {
				const isOn = visible[item.id] ?? item.defaultVisible;
				const labelsOn = labelsVisible[item.id] ?? item.defaultLabelsVisible;
				const op = opacity[item.id] ?? item.defaultOpacity;

				return (
					<div
						key={item.id}
						className="rounded-md border border-sidebar-border bg-sidebar p-2"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2 text-sm">
								<Checkbox
									checked={isOn}
									onCheckedChange={(v) => setVisible(item.id, v === true)}
								/>
								<span className="select-none">{item.title}</span>
							</div>

							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<button
									type="button"
									className="inline-flex items-center gap-1 underline-offset-4 hover:underline disabled:opacity-50"
									disabled={!isOn}
									onClick={() =>
										setLabelsVisible(
											item.id,
											!(labelsVisible[item.id] ?? item.defaultLabelsVisible),
										)
									}
									title="Labels"
								>
									<Tag className="h-4 w-4" />
									{labelsOn ? "on" : "off"}
								</button>

								<div
									className="inline-flex items-center gap-1"
									title="Transparenz"
								>
									<Blend className="h-4 w-4" />
									<span>{Math.round(op * 100)}%</span>
								</div>
							</div>
						</div>

						<div className="mt-2">
							<Slider
								value={[op]}
								onValueChange={(v) =>
									setOpacity(item.id, v[0] ?? item.defaultOpacity)
								}
								min={0}
								max={1}
								step={0.05}
								disabled={!isOn}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function LegendPanel() {
	const visible = useTocStore((s) => s.visible);
	const items = MAP_CONFIG.tocItems.filter(
		(i) => (visible[i.id] ?? i.defaultVisible) && i.legend?.length,
	);
	if (items.length === 0) {
		return (
			<div className="text-xs text-muted-foreground">
				Keine sichtbaren Layer mit Legende.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{items.map((item, idx) => (
				<div key={item.id} className="space-y-2">
					<div className="text-xs font-medium">{item.title}</div>
					<div className="space-y-1">
						{(item.legend ?? []).map((li) => (
							<div key={li.label} className="flex items-center gap-2 text-xs">
								<LegendSwatch kind={li.swatch.kind} value={li.swatch.value} />
								<span className="text-muted-foreground">{li.label}</span>
							</div>
						))}
					</div>
					{idx < items.length - 1 && <Separator />}
				</div>
			))}
		</div>
	);
}

export function AppSidebar({ map }: { map: MaplibreMap | null }) {
	const { basemapId, setBasemapId, isHydrated } =
		useBasemapStore("swisstopo-lbm");

	// sorgt dafür, dass beim Wechsel der Basemap der Style gesetzt wird
	useBasemapSync({ map, basemapId });

	return (
		<Sidebar collapsible="offcanvas">
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="flex items-center gap-2">
						<Layers className="h-4 w-4" />
						Layer
					</SidebarGroupLabel>

					<SidebarGroupContent className="pt-2">
						<Accordion
							type="multiple"
							defaultValue={["search", "basemap", "toc"]}
							className="w-full"
						>
							<AccordionItem value="search">
								<AccordionTrigger className="gap-2">
									<span className="inline-flex items-center gap-2">
										<Search className="h-4 w-4" />
										Suche
									</span>
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									<SearchPanel map={map} />
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="basemap">
								<AccordionTrigger className="gap-2">
									<span className="inline-flex items-center gap-2">
										<MapIcon className="h-4 w-4" />
										Basemap
									</span>
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									<BasemapGallery
										value={basemapId}
										onChange={setBasemapId}
										hydrated={isHydrated}
									/>{" "}
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="toc">
								<AccordionTrigger>Karteninhalt</AccordionTrigger>
								<AccordionContent className="pt-2">
									<TocPanel />
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="legend">
								<AccordionTrigger>Legende</AccordionTrigger>
								<AccordionContent className="pt-2">
									<LegendPanel />
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}

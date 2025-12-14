// app/map/features/sidebar/map-sidebar.tsx
"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
} from "@/app/components/ui/sidebar";
import { Slider } from "@/app/components/ui/slider";
import { MAP_CONFIG } from "@/app/map/config/map-config";
import { useDrawing } from "@/app/map/features/drawing/use-drawing";
import { LegendPanel } from "@/app/map/features/legend/legend-panel";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import type {
	TocItemConfig,
	TocItemId,
} from "@/app/map/features/toc/toc-types";
import {
	ArrowRight,
	Ban,
	Blend,
	Layers,
	List,
	MapPin,
	Minus,
	MousePointer2,
	PenLine,
	Pentagon,
	Tag,
	Trash2,
} from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

function TocPanel() {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const setVisible = useTocStore((s) => s.setVisible);
	const setLabelsVisible = useTocStore((s) => s.setLabelsVisible);
	const setOpacity = useTocStore((s) => s.setOpacity);

	const tocItems = MAP_CONFIG.tocItems as readonly TocItemConfig[];

	return (
		<div className="space-y-2">
			{tocItems.map((item) => {
				const id = item.id as TocItemId;

				const isOn = visible[id] ?? item.defaultVisible;
				const labelsOn = labelsVisible[id] ?? item.defaultLabelsVisible;
				const op = opacity[id] ?? item.defaultOpacity;

				return (
					<div
						key={id}
						className="rounded-md border border-sidebar-border bg-sidebar p-2"
					>
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2 text-sm">
								<Checkbox
									checked={isOn}
									onCheckedChange={(v) => setVisible(id, v === true)}
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
											id,
											!(labelsVisible[id] ?? item.defaultLabelsVisible),
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
									setOpacity(id, v[0] ?? item.defaultOpacity)
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

export function AppSidebar({ map }: { map: MaplibreMap | null }) {
	const drawing = useDrawing(map);

	return (
		<Sidebar
			collapsible="offcanvas"
			style={
				{
					"--sidebar-width": "360px",
					"--sidebar-width-mobile": "320px",
				} as React.CSSProperties
			}
		>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="flex items-center gap-2">
						<Layers className="h-4 w-4" />
						Layer
					</SidebarGroupLabel>

					<SidebarGroupContent className="pt-2">
						<Accordion
							type="multiple"
							defaultValue={["legend"]}
							className="w-full"
						>
							<AccordionItem value="toc">
								<AccordionTrigger className="gap-2">
									<span className="inline-flex items-center gap-2">
										<Layers className="h-4 w-4" />
										Karteninhalt
									</span>
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									<TocPanel />
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="legend">
								<AccordionTrigger className="gap-2">
									<span className="inline-flex items-center gap-2">
										<List className="h-4 w-4" />
										Legende
									</span>
								</AccordionTrigger>
								<AccordionContent className="pt-2">
									{/* ✅ echte dynamische Legende */}
									<LegendPanel map={map} />
								</AccordionContent>
							</AccordionItem>

							<AccordionItem value="drawing">
								<AccordionTrigger className="gap-2">
									<span className="inline-flex items-center gap-2">
										<PenLine className="h-4 w-4" />
										Zeichnen
									</span>
								</AccordionTrigger>

								<AccordionContent className="space-y-3 pt-2">
									<div className="grid grid-cols-2 gap-2">
										<button
											type="button"
											className={[
												"inline-flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs",
												drawing.mode === "select"
													? "border-primary bg-primary/10"
													: "border-sidebar-border bg-sidebar hover:bg-sidebar/80",
											].join(" ")}
											onClick={() => drawing.setMode("select")}
											title="Select / Aus"
										>
											<MousePointer2 className="h-4 w-4" />
											Aus
										</button>

										<button
											type="button"
											className={[
												"inline-flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs",
												drawing.mode === "point"
													? "border-primary bg-primary/10"
													: "border-sidebar-border bg-sidebar hover:bg-sidebar/80",
											].join(" ")}
											onClick={() => drawing.setMode("point")}
											title="Punkt setzen"
										>
											<MapPin className="h-4 w-4" />
											Punkt
										</button>

										<button
											type="button"
											className={[
												"inline-flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs",
												drawing.mode === "line"
													? "border-primary bg-primary/10"
													: "border-sidebar-border bg-sidebar hover:bg-sidebar/80",
											].join(" ")}
											onClick={() => drawing.setMode("line")}
											title="Linie zeichnen"
										>
											<Minus className="h-4 w-4" />
											Linie
										</button>

										<button
											type="button"
											className={[
												"inline-flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs",
												drawing.mode === "polygon"
													? "border-primary bg-primary/10"
													: "border-sidebar-border bg-sidebar hover:bg-sidebar/80",
											].join(" ")}
											onClick={() => drawing.setMode("polygon")}
											title="Polygon zeichnen"
										>
											<Pentagon className="h-4 w-4" />
											Polygon
										</button>

										<button
											type="button"
											className={[
												"col-span-2 inline-flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-xs",
												drawing.mode === "arrow"
													? "border-primary bg-primary/10"
													: "border-sidebar-border bg-sidebar hover:bg-sidebar/80",
											].join(" ")}
											onClick={() => drawing.setMode("arrow")}
											title="Pfeil zeichnen"
										>
											<ArrowRight className="h-4 w-4" />
											Pfeil
										</button>
									</div>

									{drawing.mode === "point" && (
										<div className="space-y-1">
											<div className="text-xs text-muted-foreground">
												Label (nur Punkt)
											</div>
											<input
												className="h-9 w-full rounded-md border border-sidebar-border bg-sidebar px-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
												placeholder="z.B. Brutplatz A"
												onChange={(e) => drawing.setLabel(e.target.value)}
											/>
										</div>
									)}

									<div className="text-[11px] leading-snug text-muted-foreground">
										{drawing.mode === "point" && "Klick setzt Punkt."}
										{(drawing.mode === "line" ||
											drawing.mode === "polygon" ||
											drawing.mode === "arrow") &&
											"Mehrere Klicks, dann Doppelklick oder Enter zum Abschliessen. Esc bricht ab."}
										{drawing.mode === "select" &&
											"Werkzeug wählen, um zu zeichnen."}
									</div>

									<div className="flex items-center gap-2">
										<button
											type="button"
											className="inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-2 py-1.5 text-xs hover:bg-sidebar/80 disabled:opacity-50"
											onClick={() => drawing.cancel()}
											disabled={!drawing.hasSketch}
											title="Aktuelle Skizze verwerfen"
										>
											<Ban className="h-4 w-4" />
											Abbrechen
										</button>

										<button
											type="button"
											className="inline-flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar px-2 py-1.5 text-xs hover:bg-sidebar/80 disabled:opacity-50"
											onClick={() => drawing.clearAll()}
											disabled={!drawing.hasFeatures && !drawing.hasSketch}
											title="Alles löschen"
										>
											<Trash2 className="h-4 w-4" />
											Löschen
										</button>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}

"use client";

import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
} from "@/app/components/ui/sidebar";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/app/components/ui/tabs";
import { cn } from "@/app/lib/utils";
import {
	formatMeasurement,
	type useDrawing,
} from "@/app/map/features/drawing/use-drawing";
import { LegendPanel } from "@/app/map/features/legend/legend-panel";
import { TocPanel } from "@/app/map/features/toc/toc-panel";
import { SwisstopoWmsPanel } from "@/app/map/features/wms/swisstopo-wms-panel";
import {
	ArrowUpRight,
	Check,
	Globe,
	Info,
	Layers,
	List,
	MapPin,
	Pencil,
	Ruler,
	Shapes,
	Trash2,
	Undo2,
	Wrench,
} from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

function ToolButton({
	active,
	onClick,
	icon,
	label,
	description,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
	description: string;
}) {
	return (
		<Button
			variant={active ? "default" : "outline"}
			className={cn(
				"flex flex-col h-auto items-start p-3 gap-1 rounded-2xl transition-all border-2 w-full",
				active
					? "border-primary bg-primary text-primary-foreground shadow-lg scale-[1.02]"
					: "border-border/40 bg-background hover:bg-muted hover:border-border text-foreground shadow-sm",
			)}
			onClick={onClick}
		>
			<div
				className={cn(
					"p-2 rounded-lg mb-1",
					active ? "bg-white/20" : "bg-primary/5 text-primary",
				)}
			>
				{icon}
			</div>
			<div className="flex flex-col items-start leading-tight text-left">
				<span className="text-[11px] font-bold">{label}</span>
				<span
					className={cn(
						"text-[9px]",
						active ? "text-primary-foreground/70" : "text-muted-foreground",
					)}
				>
					{description}
				</span>
			</div>
		</Button>
	);
}

export function AppSidebar({
	map,
	drawing,
}: {
	map: MaplibreMap | null;
	drawing: ReturnType<typeof useDrawing>;
}) {
	// Messwert nur anzeigen, wenn wir im Mess-Modus sind
	const isMeasuring = drawing.mode.startsWith("measure");
	const liveValue =
		drawing.currentSketch && isMeasuring
			? formatMeasurement(drawing.mode, drawing.currentSketch)
			: null;

	return (
		<Sidebar
			collapsible="offcanvas"
			className="border-r border-border/40 shadow-none"
			style={{ "--sidebar-width": "360px" } as React.CSSProperties}
		>
			<Tabs defaultValue="toc" className="flex flex-col h-full">
				<SidebarHeader className="p-4 pb-2 bg-background">
					<TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
						<TabsTrigger value="toc" className="gap-2 text-[11px] py-1.5 px-0">
							<Layers className="h-3.5 w-3.5" /> Ebenen
						</TabsTrigger>
						<TabsTrigger
							value="legend"
							className="gap-2 text-[11px] py-1.5 px-0"
						>
							<List className="h-3.5 w-3.5" /> Legende
						</TabsTrigger>
						<TabsTrigger
							value="tools"
							className="gap-2 text-[11px] py-1.5 px-0"
						>
							<Wrench className="h-3.5 w-3.5" /> Tools
						</TabsTrigger>
					</TabsList>
				</SidebarHeader>

				<SidebarContent className="flex-1 overflow-hidden">
					<TabsContent value="toc" className="h-full m-0 flex flex-col">
						<ScrollArea className="flex-1">
							<div className="px-4 py-2 space-y-6">
								<TocPanel />
								<section className="pt-4 border-t border-border/60">
									<div className="mb-4 px-1">
										<h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
											<Globe className="h-3 w-3" /> Externe Quellen (WMS)
										</h4>
									</div>
									<SwisstopoWmsPanel map={map} />
								</section>
							</div>
						</ScrollArea>
					</TabsContent>

					<TabsContent value="legend" className="h-full m-0 flex flex-col">
						<ScrollArea className="flex-1 px-4 py-4">
							<LegendPanel map={map} variant="sidebar" />
						</ScrollArea>
					</TabsContent>

					<TabsContent value="tools" className="h-full m-0 flex flex-col">
						<ScrollArea className="flex-1 px-4">
							<div className="py-4 space-y-8">
								{/* SEKTION 1: MESSEN (KEINE TOOLBAR) */}
								<section>
									<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3 px-1">
										Analyse & Messen
									</span>
									<div className="grid grid-cols-2 gap-2">
										<ToolButton
											active={drawing.mode === "measure-line"}
											onClick={() => drawing.setMode("measure-line")}
											icon={<Ruler className="h-4 w-4" />}
											label="Distanz"
											description="Strecke messen"
										/>
										<ToolButton
											active={drawing.mode === "measure-polygon"}
											onClick={() => drawing.setMode("measure-polygon")}
											icon={<Shapes className="h-4 w-4" />}
											label="Fläche"
											description="Areal berechnen"
										/>
									</div>
								</section>

								{/* SEKTION 2: ZEICHNEN (AKTIVIERT TOOLBAR) */}
								<section>
									<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-3 px-1">
										Skizzieren & Zeichnen
									</span>
									<div className="grid grid-cols-2 gap-2">
										<ToolButton
											active={drawing.mode.startsWith("draw-")}
											onClick={() => drawing.setMode("draw-line")}
											icon={<Pencil className="h-4 w-4" />}
											label="Zeichnen"
											description="Toolbar öffnen"
										/>
										<ToolButton
											active={drawing.mode === "select"}
											onClick={() => drawing.setMode("select")}
											icon={<Info className="h-4 w-4" />}
											label="Abfragen"
											description="Objekte bearbeiten"
										/>
									</div>
								</section>

								{/* LIVE VORSCHAU FÜR MESSUNGEN */}
								{drawing.hasSketch && (
									<div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 shadow-sm animate-in zoom-in-95 duration-200">
										<div className="flex justify-between items-center text-primary">
											<div className="flex flex-col">
												<span className="text-[9px] uppercase font-bold opacity-70 tracking-tight">
													{isMeasuring ? "Aktuelle Messung" : "Skizze aktiv"}
												</span>
												{liveValue ? (
													<span className="text-xl font-mono font-bold tabular-nums">
														{liveValue}
													</span>
												) : (
													<span className="text-sm font-semibold">
														Zeichne auf Karte...
													</span>
												)}
											</div>
											<div className="flex gap-2">
												<Button
													size="icon"
													variant="outline"
													className="h-9 w-9 rounded-xl bg-background shadow-sm"
													onClick={drawing.undoLast}
												>
													<Undo2 className="h-4 w-4" />
												</Button>
												<Button
													size="icon"
													className="h-9 w-9 rounded-xl shadow-md"
													onClick={drawing.finish}
												>
													<Check className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								)}

								{/* VERLAUF (SKIZZEN & MESSUNGEN) */}
								{drawing.hasFeatures && (
									<section className="space-y-4 pt-6 border-t border-border/60">
										<div className="flex items-center justify-between px-1">
											<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
												Elemente auf Karte
											</span>
											<Button
												variant="ghost"
												className="h-auto p-0 text-[10px] text-destructive hover:bg-transparent"
												onClick={drawing.clearAll}
											>
												<Trash2 className="mr-1 h-3 w-3" /> Alle löschen
											</Button>
										</div>

										<div className="space-y-2">
											{drawing.allFeatures.map((f) => {
												const kind = f.properties?.kind;
												const usage = f.properties?.usage;

												return (
													<div
														key={f.properties?.id}
														className="flex justify-between items-center bg-muted/30 hover:bg-muted/50 p-3 rounded-xl border border-transparent hover:border-border transition-all group"
													>
														<div className="flex items-center gap-3">
															<div
																className={cn(
																	"p-2 rounded-lg bg-background border border-border/50 shadow-sm",
																	usage === "measure"
																		? "text-blue-600"
																		: "text-amber-600",
																)}
															>
																{kind === "polygon" && (
																	<Shapes className="h-3.5 w-3.5" />
																)}
																{kind === "point" && (
																	<MapPin className="h-3.5 w-3.5" />
																)}
																{kind === "arrow" && (
																	<ArrowUpRight className="h-3.5 w-3.5" />
																)}
																{kind === "line" && (
																	<Ruler className="h-3.5 w-3.5" />
																)}
															</div>
															<div className="flex flex-col">
																<span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter leading-none mb-1">
																	{usage === "measure" ? "Messung" : "Skizze"} •{" "}
																	{kind === "polygon"
																		? "Fläche"
																		: kind === "point"
																			? "Punkt"
																			: kind === "arrow"
																				? "Pfeil"
																				: "Linie"}
																</span>
																<span className="font-mono text-sm font-bold text-foreground leading-none">
																	{kind === "point"
																		? "Markiert"
																		: formatMeasurement(kind, f)}
																</span>
															</div>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
															onClick={() =>
																drawing.deleteFeature(f.properties?.id)
															}
														>
															<Trash2 className="h-3.5 w-3.5" />
														</Button>
													</div>
												);
											})}
										</div>
									</section>
								)}
							</div>
						</ScrollArea>
					</TabsContent>
				</SidebarContent>
			</Tabs>
		</Sidebar>
	);
}

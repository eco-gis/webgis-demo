"use client";

import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	useSidebar,
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
	Check,
	Globe,
	Info,
	Layers,
	List,
	Pencil,
	Ruler,
	Shapes,
	Trash2,
	Undo2,
	Wrench,
	X,
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
				"flex flex-row md:flex-col h-auto items-center md:items-start p-4 md:p-3 gap-3 md:gap-1 rounded-2xl transition-all border-2 w-full",
				active
					? "border-primary bg-primary text-primary-foreground shadow-lg scale-[1.01]"
					: "border-border/40 bg-background hover:bg-muted text-foreground shadow-sm",
			)}
			onClick={onClick}
		>
			<div
				className={cn(
					"p-2 rounded-lg shrink-0",
					active ? "bg-white/20" : "bg-primary/5 text-primary",
				)}
			>
				{icon}
			</div>
			<div className="flex flex-col items-start leading-tight text-left overflow-hidden">
				<span className="text-sm md:text-[11px] font-bold truncate w-full">
					{label}
				</span>
				<span
					className={cn(
						"text-xs md:text-[9px] truncate w-full",
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
	const { setOpenMobile, isMobile } = useSidebar();
	const isMeasuring = drawing.mode.startsWith("measure");

	// liveValue wird hier berechnet und unten in der UI verwendet
	const liveValue =
		drawing.currentSketch && isMeasuring
			? formatMeasurement(drawing.mode, drawing.currentSketch)
			: null;

	const handleToolClick = (mode: Parameters<typeof drawing.setMode>[0]) => {
		drawing.setMode(mode);
		if (isMobile) setOpenMobile(false);
	};

	return (
		<Sidebar
			variant="sidebar"
			side="left"
			className="border-r-0 shadow-xl overflow-hidden"
		>
			<Tabs
				defaultValue="toc"
				className="flex flex-col h-full overflow-hidden bg-background"
			>
				<SidebarHeader className="p-4 pb-2 bg-background shrink-0 z-20">
					<div className="flex items-center justify-between mb-4 md:hidden">
						<span className="font-bold text-[10px] tracking-[0.2em] text-muted-foreground px-1 uppercase">
							Navigation
						</span>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full h-8 w-8"
							onClick={() => setOpenMobile(false)}
						>
							<X className="h-5 w-5" />
						</Button>
					</div>
					<TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-11 md:h-9 rounded-xl">
						<TabsTrigger
							value="toc"
							className="gap-2 text-[11px] md:text-[10px] py-1.5 rounded-lg"
						>
							<Layers className="h-3.5 w-3.5" /> Ebenen
						</TabsTrigger>
						<TabsTrigger
							value="legend"
							className="gap-2 text-[11px] md:text-[10px] py-1.5 rounded-lg"
						>
							<List className="h-3.5 w-3.5" /> Legende
						</TabsTrigger>
						<TabsTrigger
							value="tools"
							className="gap-2 text-[11px] md:text-[10px] py-1.5 rounded-lg"
						>
							<Wrench className="h-3.5 w-3.5" /> Tools
						</TabsTrigger>
					</TabsList>
				</SidebarHeader>

				<SidebarContent className="flex-1 min-h-0 overflow-hidden">
					{/* EBENEN TAB */}
					<TabsContent
						value="toc"
						className="h-full m-0 flex flex-col min-h-0 outline-none data-[state=inactive]:hidden"
					>
						<ScrollArea className="flex-1 h-full">
							<div className="px-4 py-4 space-y-8 pb-24">
								<section className="space-y-3">
									<TocPanel />
								</section>

								<section className="pt-6 border-t border-border/40">
									<div className="mb-4 px-1">
										<h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
											<Globe className="h-3 w-3" /> Externe Quellen
										</h4>
									</div>
									<SwisstopoWmsPanel map={map} />
								</section>
							</div>
						</ScrollArea>
					</TabsContent>

					{/* LEGENDE TAB */}
					<TabsContent
						value="legend"
						className="h-full m-0 flex flex-col min-h-0 outline-none data-[state=inactive]:hidden"
					>
						<ScrollArea className="flex-1 h-full">
							<div className="px-4 py-4 pb-24">
								<LegendPanel map={map} variant="sidebar" />
							</div>
						</ScrollArea>
					</TabsContent>

					{/* TOOLS TAB */}
					<TabsContent
						value="tools"
						className="h-full m-0 flex flex-col min-h-0 outline-none data-[state=inactive]:hidden"
					>
						<ScrollArea className="flex-1 h-full">
							<div className="px-4 py-4 space-y-8 pb-24">
								<section>
									<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-3 px-1">
										Analyse & Messen
									</span>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										<ToolButton
											active={drawing.mode === "measure-line"}
											onClick={() => handleToolClick("measure-line")}
											icon={<Ruler className="h-4 w-4" />}
											label="Distanz"
											description="Strecke messen"
										/>
										<ToolButton
											active={drawing.mode === "measure-polygon"}
											onClick={() => handleToolClick("measure-polygon")}
											icon={<Shapes className="h-4 w-4" />}
											label="Fläche"
											description="Areal berechnen"
										/>
									</div>
								</section>

								<section>
									<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block mb-3 px-1">
										Skizzieren & Zeichnen
									</span>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										<ToolButton
											active={drawing.mode.startsWith("draw-")}
											onClick={() => handleToolClick("draw-line")}
											icon={<Pencil className="h-4 w-4" />}
											label="Zeichnen"
											description="Toolbar öffnen"
										/>
										<ToolButton
											active={drawing.mode === "select"}
											onClick={() => handleToolClick("select")}
											icon={<Info className="h-4 w-4" />}
											label="Abfragen"
											description="Objekte bearbeiten"
										/>
									</div>
								</section>

								{/* Live Anzeige (Hier wird liveValue genutzt) */}
								{drawing.hasSketch && (
									<div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 shadow-sm animate-in slide-in-from-bottom-2 duration-200">
										<div className="flex justify-between items-center text-primary">
											<div className="flex flex-col">
												<span className="text-[9px] uppercase font-bold opacity-70 tracking-tight">
													{isMeasuring ? "Aktuelle Messung" : "Skizze aktiv"}
												</span>
												<span className="text-xl font-mono font-bold tabular-nums leading-none mt-1">
													{liveValue || "Zeichne..."}
												</span>
											</div>
											<div className="flex gap-2 shrink-0">
												<Button
													size="icon"
													variant="outline"
													className="h-10 w-10 rounded-xl bg-background border-2 border-primary/10 hover:border-primary/40"
													onClick={drawing.undoLast}
												>
													<Undo2 className="h-4 w-4" />
												</Button>
												<Button
													size="icon"
													className="h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
													onClick={drawing.finish}
												>
													<Check className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								)}

								{/* Verlauf */}
								{drawing.hasFeatures && (
									<section className="space-y-4 pt-6 border-t border-border/40">
										<div className="flex items-center justify-between px-1">
											<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
												Verlauf
											</span>
											<Button
												variant="ghost"
												className="h-auto p-0 text-[10px] text-destructive hover:bg-transparent font-bold uppercase"
												onClick={drawing.clearAll}
											>
												<Trash2 className="mr-1 h-3 w-3" /> Alle löschen
											</Button>
										</div>

										<div className="space-y-2">
											{drawing.allFeatures.map((f) => (
												<div
													key={f.properties?.id}
													className="flex justify-between items-center bg-muted/30 p-3 rounded-xl border border-border/5"
												>
													<div className="flex items-center gap-3 overflow-hidden">
														<div className="p-2 rounded-lg bg-background border border-border/40 text-primary shrink-0">
															{f.properties?.kind === "polygon" ? (
																<Shapes className="h-3.5 w-3.5" />
															) : (
																<Ruler className="h-3.5 w-3.5" />
															)}
														</div>
														<div className="flex flex-col overflow-hidden">
															<span className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-tighter text-left">
																{f.properties?.usage === "measure"
																	? "Messung"
																	: "Skizze"}
															</span>
															<span className="font-mono text-sm font-bold truncate text-left">
																{formatMeasurement(f.properties?.kind, f)}
															</span>
														</div>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="h-9 w-9 text-muted-foreground/40 hover:text-destructive shrink-0"
														onClick={() =>
															drawing.deleteFeature(f.properties?.id)
														}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
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

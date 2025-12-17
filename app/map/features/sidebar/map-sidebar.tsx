"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/app/components/ui/accordion";
import { Button } from "@/app/components/ui/button";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Sidebar, SidebarContent } from "@/app/components/ui/sidebar";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/app/components/ui/tabs";
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
	Layers,
	List,
	Pencil,
	Ruler,
	Trash2,
	Undo2,
} from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

export function AppSidebar({
	map,
	drawing,
}: {
	map: MaplibreMap | null;
	drawing: ReturnType<typeof useDrawing>;
}) {
	const liveValue = drawing.currentSketch
		? formatMeasurement(drawing.mode, drawing.currentSketch)
		: null;

	return (
		<Sidebar
			collapsible="offcanvas"
			style={{ "--sidebar-width": "360px" } as React.CSSProperties}
		>
			<SidebarContent className="bg-sidebar">
				<Tabs defaultValue="toc" className="flex h-full flex-col min-h-0">
					<div className="p-4 pb-2 border-b bg-background/50">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="toc" className="gap-2">
								<Layers className="h-4 w-4" /> Inhalt
							</TabsTrigger>
							<TabsTrigger value="legend" className="gap-2">
								<List className="h-4 w-4" /> Legende
							</TabsTrigger>
						</TabsList>
					</div>

					<div className="flex-1 overflow-hidden relative">
						<TabsContent
							value="toc"
							className="absolute inset-0 m-0 flex flex-col"
						>
							<ScrollArea className="flex-1">
								<div className="p-2">
									<TocPanel />
								</div>
							</ScrollArea>
							<div className="border-t bg-muted/30 p-4">
								<h4 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
									<Globe className="h-3 w-3" /> Externe Layer (WMS)
								</h4>
								<SwisstopoWmsPanel map={map} />
							</div>
						</TabsContent>

						<TabsContent value="legend" className="absolute inset-0 m-0 p-0">
							<ScrollArea className="h-full">
								<LegendPanel map={map} variant="sidebar" />
							</ScrollArea>
						</TabsContent>
					</div>
				</Tabs>

				<Accordion
					type="single"
					collapsible
					defaultValue="tools"
					className="w-full border-t"
				>
					<AccordionItem value="tools" className="border-b-0 px-4 py-2">
						<AccordionTrigger className="hover:no-underline py-2">
							<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
								Analyse & Zeichnen
							</span>
						</AccordionTrigger>
						<AccordionContent className="pt-2 pb-4 space-y-4">
							<div className="grid grid-cols-2 gap-2">
								<Button
									variant={drawing.mode === "line" ? "default" : "outline"}
									size="sm"
									onClick={() => drawing.setMode("line")}
								>
									<Ruler className="mr-2 h-4 w-4" /> Messen
								</Button>
								<Button
									variant={drawing.mode === "polygon" ? "default" : "outline"}
									size="sm"
									onClick={() => drawing.setMode("polygon")}
								>
									<Pencil className="mr-2 h-4 w-4" /> Skizzieren
								</Button>
							</div>

							{liveValue && (
								<div className="rounded-md border border-primary/20 bg-primary/5 p-3 animate-in fade-in zoom-in-95">
									<span className="text-[9px] uppercase font-bold text-primary/60">
										Vorschau
									</span>
									<div className="flex justify-between items-center">
										<span className="text-sm font-mono font-bold text-primary">
											{liveValue}
										</span>
										<div className="flex gap-1">
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7"
												onClick={drawing.undoLast}
											>
												<Undo2 className="h-3 w-3" />
											</Button>
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 text-green-600"
												onClick={drawing.finish}
											>
												<Check className="h-3 w-3" />
											</Button>
										</div>
									</div>
								</div>
							)}

							{drawing.hasFeatures && (
								<div className="space-y-2 pt-2 border-t">
									<div className="flex items-center justify-between">
										<span className="text-[10px] font-bold uppercase text-muted-foreground">
											Resultate
										</span>
										<Button
											variant="ghost"
											className="h-auto p-0 text-[10px] text-destructive hover:bg-transparent"
											onClick={drawing.clearAll}
										>
											Alle löschen
										</Button>
									</div>

									<div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
										{drawing.allFeatures.map((f) => (
											<div
												key={String(f.properties?.id)}
												className="flex justify-between items-center bg-muted/50 p-2 rounded-md text-[12px] group border border-transparent hover:border-border"
											>
												<div className="flex flex-col">
													<span className="text-[9px] text-muted-foreground uppercase font-semibold">
														{f.properties?.kind === "polygon"
															? "Fläche"
															: "Distanz"}
													</span>
													<span className="font-mono font-bold">
														{formatMeasurement(
															(f.properties?.kind as "line" | "polygon") ||
																"line",
															f,
														)}
													</span>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
													onClick={() =>
														drawing.deleteFeature(f.properties?.id as string)
													}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										))}
									</div>
								</div>
							)}

							{drawing.mode !== "select" && !liveValue && (
								<p className="text-[11px] text-center text-muted-foreground py-2 italic">
									Klicken Sie in die Karte, um zu starten.
								</p>
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</SidebarContent>
		</Sidebar>
	);
}

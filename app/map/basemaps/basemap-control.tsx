"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn } from "@/app/lib/utils";
import { BasemapGrid } from "@/app/map/basemaps/basemap-grid";
import type { BasemapDef, BasemapId } from "./basemap-config";
import { BASEMAPS, getBasemapById } from "./basemap-config";

export type BasemapControlProps = {
	value: BasemapId;
	onChange: (id: BasemapId) => void;
	options?: readonly BasemapDef[];
	className?: string;
	showDescription?: boolean;
	label?: string;
	buttonSizePx?: number;

	/** 0..1 */
	opacity: number;
	onOpacityChange: (opacity: number) => void;
};

export function BasemapControl({
		value,
		onChange,
		options = BASEMAPS,
		className,
		showDescription = true,
		label = "Hintergrundkarten",
		buttonSizePx = 64, // Etwas größer für bessere Haptik
		opacity,
		onOpacityChange,
	}: BasemapControlProps) {
		const [open, setOpen] = useState(false);

		const selected = getBasemapById(value);
		const thumb = selected.thumbnailUrl ?? null;

		return (
			<div className={cn("relative pointer-events-auto", className)}>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<button
							type="button"
							style={{ width: buttonSizePx, height: buttonSizePx }}
							className={cn(
								"group relative overflow-hidden rounded-2xl border border-white/20 bg-background/80 shadow-lg backdrop-blur-md",
								"ring-offset-background transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								open && "ring-2 ring-ring",
							)}
							aria-label="Hintergrundkarten wählen"
						>
							{thumb ? (
								<Image
									src={thumb}
									alt={selected.label}
									fill
									sizes={`${buttonSizePx}px`}
									className={cn(
										"object-cover transition-all duration-500 group-hover:scale-110",
										open ? "scale-110 blur-[2px]" : "scale-100",
									)}
									priority={false}
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
									Map
								</div>
							)}

							{/* Elegantes Overlay für den Button */}
							<div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/0" />

							{/* Status-Indikator */}
							<div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-lg bg-white/90 shadow-sm backdrop-blur transition-transform duration-300 group-hover:-translate-y-0.5">
								<ChevronUp
									className={cn(
										"h-3.5 w-3.5 transition-transform duration-300",
										open && "rotate-180",
									)}
								/>
							</div>
						</button>
					</PopoverTrigger>

					<PopoverContent
						align="end"
						side="top"
						sideOffset={12}
						className="w-85 overflow-hidden rounded-3xl border-none bg-background/95 p-0 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
					>
						<div className="flex flex-col">
							{/* Header Bereich */}
							<div className="bg-slate-50/50 p-4 pb-3 dark:bg-slate-900/50">
								<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
									{label}
								</span>
								<h3 className="text-base font-semibold tracking-tight text-foreground">
									{selected.label}
								</h3>
							</div>

							{/* Grid Bereich */}
							<div className="p-4 pt-2">
								<BasemapGrid
									value={value}
									options={options}
									columns={2}
									onChange={(id) => {
										onChange(id);
										setOpen(false);
									}}
									showOpacity
									opacity={opacity}
									onOpacityChange={onOpacityChange}
								/>

								{showDescription && selected.description && (
									<div className="mt-4 rounded-xl bg-slate-100/50 p-3 dark:bg-slate-800/50">
										<p className="text-[11px] leading-relaxed text-muted-foreground/90">
											{selected.description}
										</p>
									</div>
								)}
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>
		);
	}
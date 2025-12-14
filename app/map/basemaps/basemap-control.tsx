"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Card } from "@/app/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
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
	buttonSizePx = 56,
	opacity,
	onOpacityChange,
}: BasemapControlProps) {
	const [open, setOpen] = useState(false);

	const selected = getBasemapById(value);
	const thumb = selected.thumbnailUrl ?? null;

	const sizeStyle: React.CSSProperties = {
		width: `${buttonSizePx}px`,
		height: `${buttonSizePx}px`,
	};

	return (
		<div
			className={cn(
				"absolute left-3 z-50",
				"bottom-[calc(env(safe-area-inset-bottom,0px)+4rem)]",
				className,
			)}
		>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button
						type="button"
						style={sizeStyle}
						className={cn(
							"group relative overflow-hidden rounded-2xl border border-border bg-background shadow-sm",
							"ring-offset-background transition hover:shadow",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
						)}
						aria-label="Hintergrundkarten wählen"
						title="Hintergrundkarten wählen"
					>
						{thumb ? (
							<Image
								src={thumb}
								alt={selected.label}
								fill
								sizes={`${buttonSizePx}px`}
								className="object-cover transition-transform group-hover:scale-105"
								priority={false}
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
								Map
							</div>
						)}

						<div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/30 to-transparent" />

						<div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-background/85 backdrop-blur">
							<ChevronDown className="h-4 w-4" />
						</div>
					</button>
				</PopoverTrigger>

				<PopoverContent align="start" side="top" sideOffset={10} className="w-[320px] p-0">
					<Card className="border-0 shadow-none">
						<div className="p-3">
							<div className="mb-2">
								<div className="text-[11px] text-muted-foreground leading-none">
									{label}
								</div>
								<div className="mt-1 text-sm font-medium leading-tight">
									{selected.label}
								</div>
							</div>

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

							{showDescription && selected.description ? (
								<p className="mt-2 text-[11px] leading-snug text-muted-foreground">
									{selected.description}
								</p>
							) : null}
						</div>
					</Card>
				</PopoverContent>
			</Popover>
		</div>
	);
}

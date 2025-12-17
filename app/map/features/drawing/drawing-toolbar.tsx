"use client";

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
	ArrowRight,
	Check,
	type LucideIcon,
	MapPin,
	Minus,
	Pentagon,
	Trash2,
	Undo2,
	X,
} from "lucide-react";
import type { DrawMode } from "./draw-types";
import { formatMeasurement } from "./use-drawing";

interface Drawing {
	mode: DrawMode;
	hasSketch: boolean;
	hasFeatures: boolean;
	currentSketch: GeoJSON.Feature | null;
	setMode: (mode: DrawMode) => void;
	undoLast: () => void;
	finish: () => void;
	cancel: () => void;
	clearAll: () => void;
}

interface DrawingToolbarProps {
	drawing: Drawing;
}

export function DrawingToolbar({ drawing }: DrawingToolbarProps) {
	const allModes: { mode: DrawMode; icon: LucideIcon; label: string }[] = [
		{ mode: "point", icon: MapPin, label: "Punkt setzen" },
		{ mode: "line", icon: Minus, label: "Linie / Distanz" },
		{ mode: "polygon", icon: Pentagon, label: "Fläche / Polygon" },
		{ mode: "arrow", icon: ArrowRight, label: "Pfeil" },
	];

	/**
	 * DYNAMISCHE FILTERUNG:
	 * Mess-Modus (line): Nur Linie & Polygon anzeigen.
	 * Skizzier-Modus (alles andere): Alle Werkzeuge inklusive Punkt & Pfeil anzeigen.
	 */
	const visibleModes =
		drawing.mode === "line"
			? allModes.filter((m) => m.mode === "line" || m.mode === "polygon")
			: allModes;

	const measurement = drawing.currentSketch
		? formatMeasurement(drawing.mode, drawing.currentSketch)
		: null;

	return (
		<TooltipProvider>
			<div className="flex flex-col gap-2 rounded-lg border bg-background/95 p-1 shadow-2xl backdrop-blur-md">
				{/* 1. MODUS BUTTONS */}
				{visibleModes.map((m) => (
					<Tooltip key={m.mode}>
						<TooltipTrigger asChild>
							<Button
								variant={drawing.mode === m.mode ? "default" : "ghost"}
								size="icon"
								className="h-9 w-9"
								onClick={() => drawing.setMode(m.mode)}
							>
								<m.icon className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">{m.label}</TooltipContent>
					</Tooltip>
				))}

				{/* 2. MESSWERT-POPUP */}
				{drawing.hasSketch && measurement && (
					<div className="absolute left-12 top-0 flex items-center gap-2 whitespace-nowrap rounded-md border bg-primary px-3 py-2 shadow-xl animate-in fade-in slide-in-from-left-2 text-primary-foreground">
						<div className="flex flex-col leading-tight">
							<span className="text-[10px] uppercase font-bold opacity-80">
								{drawing.mode === "polygon" ? "Areal" : "Distanz"}
							</span>
							<span className="text-sm font-mono font-bold">{measurement}</span>
						</div>
					</div>
				)}

				{/* 3. AKTIONEN */}
				{drawing.hasSketch && (
					<>
						<Separator className="my-1" />
						<div className="flex flex-col gap-2">
							<ActionButton
								icon={Undo2}
								label="Rückgängig"
								color="bg-orange-100 text-orange-600 hover:bg-orange-200"
								onClick={drawing.undoLast}
							/>
							<ActionButton
								icon={Check}
								label="Abschließen"
								color="bg-green-100 text-green-600 hover:bg-green-200"
								onClick={drawing.finish}
							/>
							<ActionButton
								icon={X}
								label="Abbrechen"
								color="bg-red-100 text-red-600 hover:bg-red-200"
								onClick={drawing.cancel}
							/>
						</div>
					</>
				)}

				{/* 4. LÖSCHEN */}
				{drawing.hasFeatures && !drawing.hasSketch && (
					<>
						<Separator className="my-1" />
						<ActionButton
							icon={Trash2}
							label="Leeren"
							color="text-destructive hover:bg-destructive/10"
							onClick={drawing.clearAll}
						/>
					</>
				)}
			</div>
		</TooltipProvider>
	);
}

function ActionButton({
	icon: Icon,
	label,
	onClick,
	color,
}: {
	icon: LucideIcon;
	label: string;
	onClick: () => void;
	color: string;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="secondary"
					size="icon"
					className={`h-9 w-9 ${color}`}
					onClick={onClick}
				>
					<Icon className="h-4 w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">{label}</TooltipContent>
		</Tooltip>
	);
}

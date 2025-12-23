"use client";

import {
	ArrowUpRight,
	Check,
	ChevronLeft,
	type LucideIcon,
	MapPin,
	MousePointer2,
	Pencil,
	Ruler,
	Shapes,
	Trash2,
	Undo2,
	X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils";
import type { DrawMode } from "./use-drawing";

interface Drawing {
	mode: DrawMode;
	hasSketch: boolean;
	hasFeatures: boolean;
	setMode: (mode: DrawMode) => void;
	undoLast: () => void;
	finish: () => void;
	cancel: () => void;
	clearAll: () => void;
}

interface DrawingToolbarProps {
	drawing: Drawing;
	className?: string;
}

export function DrawingToolbar({ drawing, className }: DrawingToolbarProps) {
	const [isCollapsed, setIsCollapsed] = useState(false);

	const drawTools = [
		{ mode: "draw-point" as const, icon: MapPin, label: "Punkt" },
		{ mode: "draw-arrow" as const, icon: ArrowUpRight, label: "Pfeil" },
		{ mode: "draw-line" as const, icon: Pencil, label: "Linie" },
		{ mode: "draw-polygon" as const, icon: Shapes, label: "Fläche" },
	];

	const measureTools = [
		{ mode: "measure-line" as const, icon: Ruler, label: "Distanz" },
		{ mode: "measure-polygon" as const, icon: Shapes, label: "Fläche" },
	];

	const onSelectTool = (next: DrawMode) => {
		if (drawing.mode === next) {
			drawing.setMode("select");
			return;
		}
		if (drawing.hasSketch) drawing.finish();
		drawing.setMode(next);
	};

	// Responsive Container-Klassen
	// Desktop: Vertikal links | Mobile: Horizontal unten mittig
	const containerClasses = cn(
		"pointer-events-auto flex gap-1.5 md:gap-2 rounded-2xl border bg-background/95 p-1.5 md:p-2 shadow-2xl backdrop-blur-md animate-in duration-200",
		"fixed md:absolute",
		// Mobile Layout (Unten)
		"bottom-6 left-1/2 -translate-x-1/2 flex-row items-center w-auto max-w-[95vw] overflow-x-auto no-scrollbar",
		// Desktop Layout (Seite)
		"md:bottom-auto md:left-auto md:translate-x-0 md:flex-col md:w-12 md:max-w-none",
		className,
	);

	if (isCollapsed) {
		return (
			<div
				className={cn(
					"pointer-events-auto fixed md:absolute bottom-6 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0",
					className,
				)}>
				<Button
					variant="outline"
					size="icon"
					className="h-12 w-12 md:h-10 md:w-10 rounded-full bg-background/95 shadow-lg border-primary/20"
					onClick={() => setIsCollapsed(false)}>
					<Pencil className="h-5 w-5 text-primary" />
				</Button>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className={containerClasses}>
				{/* Toggle zum Minimieren */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 md:h-6 md:w-9 shrink-0"
					onClick={() => setIsCollapsed(true)}>
					<ChevronLeft className="h-4 w-4 text-muted-foreground md:block hidden" />
					<X className="h-4 w-4 text-muted-foreground md:hidden block" />
				</Button>

				<ToolButton
					icon={MousePointer2}
					label="Auswählen"
					isActive={drawing.mode === "select"}
					onClick={() => drawing.setMode("select")}
				/>

				<Separator orientation="vertical" className="h-6 md:hidden block bg-border/60" />
				<Separator orientation="horizontal" className="w-full hidden md:block bg-border/60" />

				{/* ZEICHEN-TOOLS */}
				<div className="flex flex-row md:flex-col gap-1">
					{drawTools.map((tool) => (
						<ToolButton
							key={tool.mode}
							icon={tool.icon}
							label={tool.label}
							isActive={drawing.mode === tool.mode}
							onClick={() => onSelectTool(tool.mode)}
						/>
					))}
				</div>

				<Separator orientation="vertical" className="h-6 md:hidden block bg-border/60" />
				<Separator orientation="horizontal" className="w-full hidden md:block bg-border/60" />

				{/* MESS-TOOLS */}
				<div className="flex flex-row md:flex-col gap-1">
					{measureTools.map((tool) => (
						<ToolButton
							key={tool.mode}
							icon={tool.icon}
							label={tool.label}
							isActive={drawing.mode === tool.mode}
							onClick={() => onSelectTool(tool.mode)}
						/>
					))}
				</div>

				{/* AKTIONEN (Undo, Finish) - Werden bei Sketch eingeblendet */}
				{drawing.hasSketch && (
					<>
						<Separator orientation="vertical" className="h-6 md:hidden block bg-border/60" />
						<div className="flex flex-row md:flex-col gap-1 animate-in zoom-in-90">
							<ActionButton icon={Undo2} label="Zurück" className="text-orange-600" onClick={drawing.undoLast} />
							<ActionButton
								icon={Check}
								label="Fertig"
								className="bg-green-600 text-white hover:bg-green-700"
								onClick={drawing.finish}
							/>
						</div>
					</>
				)}

				{/* DELETE ALL - Nur wenn keine aktive Skizze, aber Features da sind */}
				{drawing.hasFeatures && !drawing.hasSketch && (
					<>
						<Separator orientation="vertical" className="h-6 md:hidden block bg-border/60" />
						<ActionButton
							icon={Trash2}
							label="Löschen"
							className="text-destructive"
							onClick={() => {
								if (window.confirm("Alle Zeichnungen entfernen?")) drawing.clearAll();
							}}
						/>
					</>
				)}
			</div>
		</TooltipProvider>
	);
}

function ToolButton({ icon: Icon, label, isActive, onClick }: ToolButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant={isActive ? "default" : "ghost"}
					size="icon"
					className={cn(
						"h-10 w-10 md:h-9 md:w-9 rounded-xl shrink-0 transition-all",
						isActive && "shadow-md scale-110 md:scale-100",
					)}
					onClick={onClick}>
					<Icon className="h-5 w-5 md:h-4 md:w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="top" className="md:hidden" sideOffset={12}>
				<p className="text-xs font-semibold">{label}</p>
			</TooltipContent>
			<TooltipContent side="right" className="hidden md:block" sideOffset={12}>
				<p className="text-xs font-semibold">{label}</p>
			</TooltipContent>
		</Tooltip>
	);
}

function ActionButton({ icon: Icon, label, onClick, className }: ActionButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn("h-10 w-10 md:h-9 md:w-9 rounded-xl shrink-0", className)}
					onClick={onClick}>
					<Icon className="h-5 w-5 md:h-4 md:w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="top" className="md:hidden" sideOffset={12}>
				<p className="text-xs font-semibold">{label}</p>
			</TooltipContent>
			<TooltipContent side="right" className="hidden md:block" sideOffset={12}>
				<p className="text-xs font-semibold">{label}</p>
			</TooltipContent>
		</Tooltip>
	);
}

interface ToolButtonProps {
	icon: LucideIcon;
	label: string;
	isActive: boolean;
	onClick: () => void;
}

interface ActionButtonProps {
	icon: LucideIcon;
	label: string;
	onClick: () => void;
	className?: string;
}

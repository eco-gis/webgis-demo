"use client";

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils";
import {
	ArrowUpRight,
	Check,
	ChevronLeft,
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
	// Interner State, ob die Toolbar gerade minimiert ist
	const [isCollapsed, setIsCollapsed] = useState(false);

	const drawTools = [
		{ mode: "draw-point" as const, icon: MapPin, label: "Punkt setzen" },
		{
			mode: "draw-arrow" as const,
			icon: ArrowUpRight,
			label: "Pfeil zeichnen",
		},
		{ mode: "draw-line" as const, icon: Pencil, label: "Linie zeichnen" },
		{ mode: "draw-polygon" as const, icon: Shapes, label: "Fläche zeichnen" },
	];

	const measureTools = [
		{ mode: "measure-line" as const, icon: Ruler, label: "Distanz messen" },
		{ mode: "measure-polygon" as const, icon: Shapes, label: "Fläche messen" },
	];

	const onSelectTool = (next: DrawMode) => {
		if (drawing.mode === next) {
			drawing.setMode("select");
			return;
		}
		if (drawing.hasSketch) drawing.finish();
		drawing.setMode(next);
	};

	if (isCollapsed) {
		// Wenn die Toolbar minimiert ist, zeigen wir nur einen "Öffnen"-Button
		return (
			<TooltipProvider>
				<div className={cn("pointer-events-auto", className)}>
					<Button
						variant="outline"
						size="icon"
						className="h-10 w-10 rounded-full bg-background/95 shadow-lg backdrop-blur-md border-primary/20 hover:border-primary/50 transition-all"
						onClick={() => setIsCollapsed(false)}
					>
						<Pencil className="h-4 w-4 text-primary" />
					</Button>
				</div>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider>
			<div
				className={cn(
					"pointer-events-auto flex flex-col gap-2 rounded-2xl border bg-background/95 p-1.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-left-2 duration-200 w-12",
					className,
				)}
			>
				{/* Toggle zum Minimieren */}
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-9 rounded-md hover:bg-muted mb-1"
					onClick={() => {
						setIsCollapsed(true);
						drawing.setMode("select"); // Optional: Modus beenden beim Einklappen
					}}
				>
					<ChevronLeft className="h-4 w-4 text-muted-foreground" />
				</Button>

				<ToolButton
					icon={MousePointer2}
					label="Auswählen (Esc)"
					isActive={drawing.mode === "select"}
					onClick={() => drawing.setMode("select")}
				/>

				<Separator className="bg-border/60" />

				<div className="flex flex-col gap-1">
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

				<Separator className="bg-border/60" />

				<div className="flex flex-col gap-1">
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

				{/* Kontext-Aktionen */}
				{drawing.hasSketch && (
					<div className="flex flex-col gap-1 mt-1 animate-in zoom-in-90">
						<Separator className="mb-1 bg-border/60" />
						<ActionButton
							icon={Undo2}
							label="Schritt zurück"
							className="text-orange-600 hover:bg-orange-50"
							onClick={drawing.undoLast}
						/>
						<ActionButton
							icon={Check}
							label="Fertigstellen"
							className="bg-green-600 text-white hover:bg-green-700 shadow-sm"
							onClick={drawing.finish}
						/>
						<ActionButton
							icon={X}
							label="Abbrechen"
							className="text-muted-foreground hover:bg-muted"
							onClick={drawing.cancel}
						/>
					</div>
				)}

				{/* Alles löschen */}
				{drawing.hasFeatures && !drawing.hasSketch && (
					<div className="flex flex-col gap-1 mt-1">
						<Separator className="mb-1 bg-border/60" />
						<ActionButton
							icon={Trash2}
							label="Alle Elemente löschen"
							className="text-destructive hover:bg-destructive/10"
							onClick={() => {
								if (window.confirm("Alle Zeichnungen entfernen?"))
									drawing.clearAll();
							}}
						/>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
}

// Hilfskomponenten wie zuvor...
interface ToolButtonProps {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	isActive: boolean;
	onClick: () => void;
}

function ToolButton({ icon: Icon, label, isActive, onClick }: ToolButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant={isActive ? "default" : "ghost"}
					size="icon"
					className={cn(
						"h-9 w-9 rounded-xl transition-all",
						isActive && "shadow-md",
					)}
					onClick={onClick}
				>
					<Icon className="h-4 w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right" sideOffset={12}>
				<p className="text-xs font-semibold">{label}</p>
			</TooltipContent>
		</Tooltip>
	);
}

interface ActionButtonProps {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	onClick: () => void;
	className?: string;
}

function ActionButton({ icon: Icon, label, onClick, className }: ActionButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn("h-9 w-9 rounded-xl", className)}
					onClick={onClick}
				>
					<Icon className="h-4 w-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right" sideOffset={12}>
				<p className="text-xs font-semibold">{label}</p>
			</TooltipContent>
		</Tooltip>
	);
}

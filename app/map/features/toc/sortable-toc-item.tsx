"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Tag } from "lucide-react"; // GripVertical ist oft besser für Mobile

import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/app/lib/utils";
import type { TocItemConfig, TocItemId } from "./toc-types";

export function SortableTocItem(props: {
	item: TocItemConfig;
	isOn: boolean;
	labelsOn: boolean;
	op: number;
	setVisible: (id: TocItemId, v: boolean) => void;
	setLabelsVisible: (id: TocItemId, v: boolean) => void;
	setOpacity: (id: TocItemId, v: number) => void;
}) {
	const { item, isOn, labelsOn, op, setVisible, setLabelsVisible, setOpacity } = props;

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 50 : "auto", // Wichtig für Mobile-Overlays
		position: "relative",
	};

	const hasLabels = (item.labelLayerIds?.length ?? 0) > 0;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"rounded-xl border border-sidebar-border bg-sidebar p-3 mb-1 shadow-sm transition-shadow",
				isDragging && "opacity-60 shadow-xl border-primary/50 ring-2 ring-primary/20",
			)}>
			<div className="flex items-center gap-3">
				{/* 1. Vergrößerter Drag-Handle für bessere Touch-Bedienung */}
				<button
					type="button"
					className={cn(
						"h-10 w-8 shrink-0 flex items-center justify-center rounded-lg -ml-1",
						"text-muted-foreground/40 hover:text-primary hover:bg-muted/60 transition-colors",
						"cursor-grab active:cursor-grabbing touch-none", // touch-none verhindert Browser-Scrollen während Drag
					)}
					aria-label="Layer-Reihenfolge ändern"
					{...attributes}
					{...listeners}>
					<GripVertical className="h-5 w-5" />
				</button>

				{/* 2. MIN-W-0 ist der Lebensretter für das Layout! */}
				<div className="min-w-0 flex-1 flex flex-col gap-1">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate text-sm font-semibold text-foreground tracking-tight">{item.title}</span>
						<Switch
							checked={isOn}
							onCheckedChange={(v) => setVisible(item.id, v)}
							className="scale-90" // Etwas kleiner für Mobile-Ästhetik
						/>
					</div>

					{/* Untere Reihe: Labels und Opacity-Wert */}
					<div className="flex items-center justify-between h-5">
						<button
							type="button"
							className={cn(
								"inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
								isOn && hasLabels ? "text-primary hover:text-primary/80" : "text-muted-foreground/40",
							)}
							disabled={!isOn || !hasLabels}
							onClick={() => setLabelsVisible(item.id, !labelsOn)}>
							<Tag className={cn("h-3 w-3", labelsOn && "fill-current")} />
							{labelsOn ? "Labels an" : "Labels aus"}
						</button>

						<span className="text-[10px] font-mono font-bold text-muted-foreground/60 tabular-nums">
							{Math.round(op * 100)}%
						</span>
					</div>

					{/* Slider-Container mit mehr Platz für Daumen */}
					<div className="mt-2 py-1">
						<Slider
							value={[op]}
							onValueChange={(v) => setOpacity(item.id, v[0] ?? 1)}
							min={0}
							max={1}
							step={0.05}
							disabled={!isOn}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

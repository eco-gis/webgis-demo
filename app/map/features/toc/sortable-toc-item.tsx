"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Tag } from "lucide-react";
import * as React from "react";

import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/app/lib/utils";
import type { TocItemConfig, TocItemId } from "./toc-types";

type SortableTocItemProps = {
	item: TocItemConfig;
	isOn: boolean;
	labelsOn: boolean;
	op: number;
	setVisible: (id: TocItemId, v: boolean) => void;
	setLabelsVisible: (id: TocItemId, v: boolean) => void;
	setOpacity: (id: TocItemId, v: number) => void;
};

function clamp01(n: number): number {
	if (!Number.isFinite(n)) return 1;
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

export function SortableTocItem(props: SortableTocItemProps) {
	const { item, isOn, labelsOn, op, setVisible, setLabelsVisible, setOpacity } = props;

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});

	const style = React.useMemo<React.CSSProperties>(() => {
		return {
			transform: CSS.Transform.toString(transform),
			transition,
			zIndex: isDragging ? 50 : "auto",
			position: "relative",
		};
	}, [transform, transition, isDragging]);

	const hasLabels = (item.labelLayerIds?.length ?? 0) > 0;
	const safeOpacity = clamp01(op);

	const onToggleVisible = React.useCallback(
		(v: boolean) => {
			setVisible(item.id, v);
		},
		[item.id, setVisible],
	);

	const onToggleLabels = React.useCallback(() => {
		setLabelsVisible(item.id, !labelsOn);
	}, [item.id, labelsOn, setLabelsVisible]);

	const onOpacityChange = React.useCallback(
		(values: number[]) => {
			const next = clamp01(values[0] ?? 1);
			setOpacity(item.id, next);
		},
		[item.id, setOpacity],
	);

	const labelsDisabled = !isOn || !hasLabels;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"rounded-xl border border-sidebar-border bg-sidebar p-3 mb-1 shadow-sm transition-shadow",
				isDragging && "opacity-60 shadow-xl border-primary/50 ring-2 ring-primary/20",
			)}>
			{/* Root row: min-w-0 verhindert Flex-Overflow durch lange Titel */}
			<div className="flex items-center gap-3 min-w-0">
				{/* Drag handle */}
				<button
					type="button"
					aria-label="Layer-Reihenfolge ändern"
					className={cn(
						"h-10 w-8 shrink-0 flex items-center justify-center rounded-lg -ml-1",
						"text-muted-foreground/40 hover:text-primary hover:bg-muted/60 transition-colors",
						"cursor-grab active:cursor-grabbing touch-none select-none",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
					)}
					{...attributes}
					{...listeners}>
					<GripVertical className="h-5 w-5" />
				</button>

				{/* Content column */}
				<div className="min-w-0 flex-1 flex flex-col gap-1">
					{/* Top row: title + switch. Wichtig: min-w-0 auf Row + Titel flex-1/min-w-0 */}
					<div className="flex items-center gap-2 min-w-0">
						<span
							className={cn(
								"min-w-0 flex-1 truncate text-sm font-semibold text-foreground tracking-tight",
								// Optionaler Hardening-Mode gegen extrem untrennbare Strings:
								// "[overflow-wrap:anywhere]",
							)}
							title={item.title}>
							{item.title}
						</span>

						<Switch checked={isOn} onCheckedChange={onToggleVisible} className="scale-90 shrink-0" />
					</div>

					{/* Middle row: labels toggle + opacity */}
					<div className="flex items-center justify-between h-5 min-w-0">
						<button
							type="button"
							onClick={onToggleLabels}
							disabled={labelsDisabled}
							className={cn(
								"inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
								!labelsDisabled ? "text-primary hover:text-primary/80" : "text-muted-foreground/40",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded",
							)}
							aria-disabled={labelsDisabled}>
							<Tag className={cn("h-3 w-3", labelsOn && !labelsDisabled && "fill-current")} />
							{labelsOn ? "Labels an" : "Labels aus"}
						</button>

						<span className="shrink-0 text-[10px] font-mono font-bold text-muted-foreground/60 tabular-nums">
							{Math.round(safeOpacity * 100)}%
						</span>
					</div>

					{/* Slider */}
					<div className="mt-2 py-1">
						<Slider
							value={[safeOpacity]}
							onValueChange={onOpacityChange}
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

// app/map/features/toc/sortable-toc-item.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tag } from "lucide-react";

import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { cn } from "@/app/lib/utils";
import type { TocItemConfig, TocItemId } from "./toc-types";

function DragHandleDots() {
	return (
		<span className="grid grid-cols-2 gap-0.5">
			{Array.from({ length: 6 }).map((_, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: static dots
					key={i}
					className="h-1 w-1 rounded-full bg-muted-foreground/60"
				/>
			))}
		</span>
	);
}

export function SortableTocItem(props: {
	item: TocItemConfig;
	isOn: boolean;
	labelsOn: boolean;
	op: number;
	setVisible: (id: TocItemId, v: boolean) => void;
	setLabelsVisible: (id: TocItemId, v: boolean) => void;
	setOpacity: (id: TocItemId, v: number) => void;
}) {
	const { item, isOn, labelsOn, op, setVisible, setLabelsVisible, setOpacity } =
		props;

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: item.id });

	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	const hasLabels = (item.labelLayerIds?.length ?? 0) > 0;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"rounded-md border border-sidebar-border bg-sidebar p-2",
				isDragging && "opacity-80",
			)}
		>
			<div className="flex items-start gap-2">
				<button
					type="button"
					className={cn(
						"mt-0.5 inline-flex h-8 w-6 shrink-0 items-center justify-center rounded-sm",
						"opacity-60 hover:bg-muted/40 hover:opacity-100",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					)}
					aria-label="Layer-Reihenfolge ändern"
					title="Ziehen zum Umordnen"
					{...attributes}
					{...listeners}
				>
					<DragHandleDots />
				</button>

				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<div className="truncate text-sm">{item.title}</div>
						<Switch checked={isOn} onCheckedChange={(v) => setVisible(item.id, v)} />
					</div>

					<div className="mt-1 flex items-center justify-between gap-2">
						<button
							type="button"
							className={cn(
								"inline-flex items-center gap-1 text-[11px] text-muted-foreground",
								"hover:text-foreground disabled:opacity-50",
							)}
							disabled={!isOn || !hasLabels}
							onClick={() => setLabelsVisible(item.id, !labelsOn)}
							title="Labels"
						>
							<Tag className="h-3.5 w-3.5" />
							{labelsOn ? "Labels on" : "Labels off"}
						</button>

						<div className="text-[11px] text-muted-foreground">
							{Math.round(op * 100)}%
						</div>
					</div>

					<div className="mt-2">
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

"use client";

import { MAP_CONFIG } from "@/app/map/config/map-config";
import { SortableTocItem } from "@/app/map/features/toc/sortable-toc-item";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import type { TocItemConfig } from "@/app/map/features/toc/toc-types";
import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	TouchSensor, // Wichtig für Mobile
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMemo } from "react";

export function TocPanel() {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const order = useTocStore((s) => s.order);
	const setOrder = useTocStore((s) => s.setOrder);
	const setVisible = useTocStore((s) => s.setVisible);
	const setLabelsVisible = useTocStore((s) => s.setLabelsVisible);
	const setOpacity = useTocStore((s) => s.setOpacity);
	const dynamicItems = useTocStore((s) => s.dynamicItems);

	const allItems = useMemo(
		() => [...(MAP_CONFIG.tocItems as TocItemConfig[]), ...dynamicItems],
		[dynamicItems],
	);

	const orderedItems = useMemo(() => {
		if (!order.length) return allItems;
		const itemMap = new Map(allItems.map((it) => [it.id, it]));
		const sorted = order
			.map((id) => itemMap.get(id))
			.filter(Boolean) as TocItemConfig[];

		const remaining = allItems.filter((it) => !order.includes(it.id));
		return [...sorted, ...remaining];
	}, [allItems, order]);

	const sensors = useSensors(
		// PointerSensor für Desktop
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		// TouchSensor für Mobile (verhindert Scroll-Konflikte)
		useSensor(TouchSensor, {
			activationConstraint: { delay: 250, tolerance: 5 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			const oldIndex = orderedItems.findIndex((it) => it.id === active.id);
			const newIndex = orderedItems.findIndex((it) => it.id === over.id);
			const newOrder = arrayMove(orderedItems, oldIndex, newIndex).map(
				(it) => it.id,
			);
			setOrder(newOrder);
		}
	}

	if (orderedItems.length === 0) {
		return (
			<div className="p-8 text-center text-sm text-muted-foreground w-full">
				Keine Ebenen vorhanden
			</div>
		);
	}

	return (
		/* WICHTIG: overflow-x-hidden und min-w-0 verhindern das Aufblähen der Sidebar */
		<div className="w-full flex flex-col min-w-0 overflow-x-hidden">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext
					items={orderedItems.map((it) => it.id)}
					strategy={verticalListSortingStrategy}
				>
					<div className="flex flex-col gap-2 w-full min-w-0">
						{orderedItems.map((item) => (
							<SortableTocItem
								key={item.id}
								item={item}
								isOn={visible[item.id] ?? item.defaultVisible ?? true}
								labelsOn={
									labelsVisible[item.id] ?? item.defaultLabelsVisible ?? false
								}
								op={opacity[item.id] ?? item.defaultOpacity ?? 1}
								setVisible={setVisible}
								setLabelsVisible={setLabelsVisible}
								setOpacity={setOpacity}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>
		</div>
	);
}

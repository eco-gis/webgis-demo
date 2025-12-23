// app/map/features/toc/toc-store.ts
"use client";

import { create } from "zustand";
import type { TocItemConfig, TocItemId } from "./toc-types";

type TocState = {
	dynamicItems: TocItemConfig[];

	visible: Partial<Record<TocItemId, boolean>>;
	labelsVisible: Partial<Record<TocItemId, boolean>>;
	opacity: Partial<Record<TocItemId, number>>;

	/** UI order: TOP -> BOTTOM */
	order: TocItemId[];

	initFromItems: (items: readonly TocItemConfig[]) => void;
	setOrder: (next: TocItemId[]) => void;
	ensureOrderContains: (ids: readonly TocItemId[]) => void;

	registerDynamicItem: (item: TocItemConfig) => void;
	unregisterDynamicItem: (id: TocItemId) => void;

	setVisible: (id: TocItemId, v: boolean) => void;
	setLabelsVisible: (id: TocItemId, v: boolean) => void;
	setOpacity: (id: TocItemId, v: number) => void;
};

function buildDefaults(items: readonly TocItemConfig[]): Pick<TocState, "visible" | "labelsVisible" | "opacity"> {
	const visible: TocState["visible"] = {};
	const labelsVisible: TocState["labelsVisible"] = {};
	const opacity: TocState["opacity"] = {};

	for (const i of items) {
		visible[i.id] = i.defaultVisible ?? true;
		labelsVisible[i.id] = i.defaultLabelsVisible ?? false;
		opacity[i.id] = i.defaultOpacity ?? 1;
	}

	return { visible, labelsVisible, opacity };
}

export const useTocStore = create<TocState>((set, get) => ({
	dynamicItems: [],

	visible: {},
	labelsVisible: {},
	opacity: {},

	order: [],

	initFromItems: (items) => {
		const defaults = buildDefaults(items);
		const cur = get();

		set({
			visible: { ...defaults.visible, ...cur.visible },
			labelsVisible: { ...defaults.labelsVisible, ...cur.labelsVisible },
			opacity: { ...defaults.opacity, ...cur.opacity },
		});
	},

	setOrder: (next) => set({ order: [...next] }),

	ensureOrderContains: (ids) => {
		const cur = get().order;
		const next = [...cur];
		let changed = false;

		for (const id of ids) {
			if (!next.includes(id)) {
				next.push(id);
				changed = true;
			}
		}
		if (changed) set({ order: next });
	},

	registerDynamicItem: (item) => {
		const cur = get();

		if (!cur.dynamicItems.some((x) => x.id === item.id)) {
			set({ dynamicItems: [...cur.dynamicItems, item] });
		}

		set((s) => ({
			visible: {
				...s.visible,
				[item.id]: s.visible[item.id] ?? item.defaultVisible ?? true,
			},
			labelsVisible: {
				...s.labelsVisible,
				[item.id]: s.labelsVisible[item.id] ?? item.defaultLabelsVisible ?? false,
			},
			opacity: {
				...s.opacity,
				[item.id]: s.opacity[item.id] ?? item.defaultOpacity ?? 1,
			},
			order: s.order.includes(item.id) ? s.order : [...s.order, item.id],
		}));
	},

	unregisterDynamicItem: (id) =>
		set((s) => ({
			dynamicItems: s.dynamicItems.filter((x) => x.id !== id),
			order: s.order.filter((x) => x !== id),
		})),

	setVisible: (id, v) => set((s) => ({ visible: { ...s.visible, [id]: v } })),
	setLabelsVisible: (id, v) => set((s) => ({ labelsVisible: { ...s.labelsVisible, [id]: v } })),
	setOpacity: (id, v) => set((s) => ({ opacity: { ...s.opacity, [id]: v } })),
}));

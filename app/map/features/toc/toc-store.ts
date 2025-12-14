import { create } from "zustand";
import type { TocItemConfig, TocItemId } from "./toc-types";

type TocState = {
  visible: Record<TocItemId, boolean>;
  labelsVisible: Record<TocItemId, boolean>;
  opacity: Record<TocItemId, number>;

  initFromItems: (items: readonly TocItemConfig[]) => void;

  setVisible: (id: TocItemId, v: boolean) => void;
  setLabelsVisible: (id: TocItemId, v: boolean) => void;
  setOpacity: (id: TocItemId, v: number) => void;
};

function buildDefaults(items: readonly TocItemConfig[]): Pick<
  TocState,
  "visible" | "labelsVisible" | "opacity"
> {
  const visible = {} as Record<TocItemId, boolean>;
  const labelsVisible = {} as Record<TocItemId, boolean>;
  const opacity = {} as Record<TocItemId, number>;

  for (const i of items) {
    visible[i.id] = i.defaultVisible;
    labelsVisible[i.id] = i.defaultLabelsVisible;
    opacity[i.id] = i.defaultOpacity;
  }

  return { visible, labelsVisible, opacity };
}

export const useTocStore = create<TocState>((set, get) => ({
  // Start mit leeren Defaults; initFromItems muss einmal aufgerufen werden.
  visible: {} as Record<TocItemId, boolean>,
  labelsVisible: {} as Record<TocItemId, boolean>,
  opacity: {} as Record<TocItemId, number>,

  initFromItems: (items) => {
    const defaults = buildDefaults(items);

    // Merge: existierende User-States behalten, aber fehlende IDs ergänzen.
    const cur = get();
    set({
      visible: { ...defaults.visible, ...cur.visible },
      labelsVisible: { ...defaults.labelsVisible, ...cur.labelsVisible },
      opacity: { ...defaults.opacity, ...cur.opacity },
    });
  },

  setVisible: (id, v) => set((s) => ({ visible: { ...s.visible, [id]: v } })),
  setLabelsVisible: (id, v) =>
    set((s) => ({ labelsVisible: { ...s.labelsVisible, [id]: v } })),
  setOpacity: (id, v) => set((s) => ({ opacity: { ...s.opacity, [id]: v } })),
}));

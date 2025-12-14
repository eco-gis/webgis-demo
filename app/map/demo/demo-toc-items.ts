import type { TocItemConfig } from "@/app/map/features/toc/toc-types";

export const DEMO_TOC_ITEMS: readonly TocItemConfig[] = [
  {
    id: "polygons",
    title: "Habitate",
    layerIds: ["dummy-polygons-fill", "dummy-polygons-outline"],
    labelLayerIds: ["dummy-polygons-label"],
    defaultVisible: true,
    defaultLabelsVisible: true,
    defaultOpacity: 0.3,
    legend: [
      { label: "Zone", swatch: { kind: "fill", value: "#60a5fa" } },
      { label: "Umrandung", swatch: { kind: "line", value: "#2563eb" } },
    ],
  },
  {
    id: "lines",
    title: "Fliessgewässer",
    layerIds: ["dummy-lines"],
    labelLayerIds: ["dummy-lines-label"],
    defaultVisible: true,
    defaultLabelsVisible: true,
    defaultOpacity: 1,
    legend: [{ label: "Transekt", swatch: { kind: "line", value: "#16a34a" } }],
  },
  {
    id: "points",
    title: "Brutplätze",
    layerIds: ["dummy-points"],
    labelLayerIds: ["dummy-points-label"],
    defaultVisible: true,
    defaultLabelsVisible: true,
    defaultOpacity: 1,
    legend: [
      { label: "Kategorie A", swatch: { kind: "circle", value: "#dc2626" } },
      { label: "Kategorie B", swatch: { kind: "circle", value: "#ea580c" } },
      { label: "Sonst", swatch: { kind: "circle", value: "#6b7280" } },
    ],
  },
] as const;

export type TocItemId = "polygons" | "lines" | "points";

export type LegendItem = {
  label: string;
  swatch: { kind: "fill" | "line" | "circle"; value: string };
};

export type TocItemConfig = {
  id: TocItemId;
  title: string;
  layerIds: readonly string[];
  labelLayerIds: readonly string[];
  defaultVisible: boolean;
  defaultLabelsVisible: boolean;
  defaultOpacity: number;
  legend?: readonly LegendItem[];
};

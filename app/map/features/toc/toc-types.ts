export type StaticTocItemId = "polygons" | "lines" | "points" | (string & {});
export type DynamicTocItemId = `wms:${string}`;
export type TocItemId = StaticTocItemId | DynamicTocItemId;

export type TocLegendItem = {
	label: string;
	swatch: { kind: "fill" | "line" | "circle"; value: string };
};

export type TocItemConfig = {
		id: TocItemId;
		title: string;
		mapLayerIds?: readonly string[];
		labelLayerIds?: readonly string[];
		defaultVisible?: boolean;
		defaultLabelsVisible?: boolean;
		defaultOpacity?: number;
		legendUrl?: string;
		legendItems?: readonly TocLegendItem[];
	};
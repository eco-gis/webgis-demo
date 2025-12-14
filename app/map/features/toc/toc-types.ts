export type TocItemId = "polygons" | "lines" | "points";

export type TocLegendItem = {
	label: string;
	swatch: { kind: "fill" | "line" | "circle"; value: string };
};

export type TocItemConfig = {
		id: TocItemId;
		title: string;
		layerIds: string[];
		labelLayerIds?: string[];
		defaultVisible: boolean;
		defaultLabelsVisible?: boolean;
		defaultOpacity?: number;
		legend?: TocLegendItem[];
	};

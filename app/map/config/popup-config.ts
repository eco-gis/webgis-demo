// app/map/features/popup/popup-config.ts

export type PopupFieldConfig = {
	key: string;
	label: string;
	order: number;
	format?: "text" | "int" | "float";
	hideIfEmpty?: boolean;
};

export type PopupLayerConfig = {
	titleKey?: string;
	titleLabel?: string;
	fields: PopupFieldConfig[];
};

const POINTS_POPUP: PopupLayerConfig = {
	titleKey: "Art",
	fields: [
		{ key: "Anzahl Eier", label: "Anzahl Eier", order: 10, format: "int" },
		{
			key: "Anzahl geschlüpft",
			label: "Anzahl geschlüpft",
			order: 20,
			format: "int",
		},
		{
			key: "Anzahl ausgeflogen",
			label: "Anzahl ausgeflogen",
			order: 30,
			format: "int",
		},
		{ key: "Art", label: "Art", order: 40, format: "text" },
	],
};

const LINES_POPUP: PopupLayerConfig = {
	titleKey: "gewässer_name",
	fields: [
		{ key: "gewässer_name", label: "Gewässer", order: 10, format: "text" },
		{ key: "abfluss", label: "Abfluss (m³/s)", order: 20, format: "float" },
	],
};

const POLYGONS_POPUP: PopupLayerConfig = {
	titleKey: "habitat_name",
	fields: [
		{ key: "habitat_name", label: "Habitat", order: 10, format: "text" },
		{ key: "habitat_area", label: "Fläche (ha)", order: 20, format: "float" },
	],
};

export const POPUP_CONFIG: Record<string, PopupLayerConfig> = {
	// Points
	"dummy-points": POINTS_POPUP,
	"dummy-points-label": POINTS_POPUP,

	// Lines
	"dummy-lines": LINES_POPUP,
	"dummy-lines-label": LINES_POPUP,

	// Polygons
	"dummy-polygons": POLYGONS_POPUP,
	"dummy-polygons-outline": POLYGONS_POPUP,
	"dummy-polygons-label": POLYGONS_POPUP,
};

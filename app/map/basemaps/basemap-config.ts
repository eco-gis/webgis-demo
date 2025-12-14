// app/map/basemaps/basemap-config.ts

export type BasemapId =
	| "swisstopo-lbm"
	| "streets"
	| "outdoor"
	| "satellite";

export type BasemapDef = Readonly<{
	id: BasemapId;
	label: string;
	// Das ist der Style-"slug", den deine mapTilerStyleUrl(styleId) akzeptiert.
	// Beispiel: mapTilerStyleUrl("ch-swisstopo-lbm")
	styleId: string;
	// Optional: Beschreibung für UI
	description?: string;
}>;

export const BASEMAPS: readonly BasemapDef[] = [
	{
		id: "swisstopo-lbm",
		label: "swisstopo (LBM)",
		styleId: "ch-swisstopo-lbm",
		description: "Schweiz / swisstopo, gut für Kontext & Orientierung.",
	},
	{
		id: "streets",
		label: "Streets",
		styleId: "streets-v2",
		description: "Klassische Strassenkarte.",
	},
	{
		id: "outdoor",
		label: "Outdoor",
		styleId: "outdoor-v2",
		description: "Terrain/Outdoor-Look (falls verfügbar).",
	},
	{
		id: "satellite",
		label: "Satellite",
		styleId: "satellite",
		description: "Satellit (falls verfügbar).",
	},
] as const;

export function getBasemapById(id: BasemapId): BasemapDef {
	const bm = BASEMAPS.find((b) => b.id === id);
	return bm ?? BASEMAPS[0];
}

export function isBasemapId(value: string): value is BasemapId {
	return (BASEMAPS as readonly BasemapDef[]).some((b) => b.id === value);
}

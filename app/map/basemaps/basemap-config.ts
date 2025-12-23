// app/map/basemaps/basemap-config.ts

export type BasemapId = "swisstopo-lbm" | "streets" | "outdoor" | "satellite";

export type BasemapDef = Readonly<{
	id: BasemapId;
	label: string;

	// mapTilerStyleUrl(styleId)
	styleId: string;

	description?: string;

	// ✅ für BasemapControl Thumbnail-Button
	thumbnailUrl?: string;
}>;

export const BASEMAPS: readonly BasemapDef[] = [
	{
		id: "swisstopo-lbm",
		label: "swisstopo (LBM)",
		styleId: "ch-swisstopo-lbm",
		description: "Swisstopo",
		thumbnailUrl: "/images/webp/swisstopo-lbm.webp",
	},
	{
		id: "streets",
		label: "Streets",
		styleId: "streets-v2",
		description: "OpenStreetMap",
		thumbnailUrl: "/images/webp/streets.webp",
	},
	{
		id: "outdoor",
		label: "Outdoor",
		styleId: "outdoor-v2",
		description: "",
		thumbnailUrl: "/images/webp/outdoor.webp",
	},
	{
		id: "satellite",
		label: "Satellite",
		styleId: "satellite",
		description: "",
		thumbnailUrl: "/images/webp/satellite.webp",
	},
] as const;

export function getBasemapById(id: BasemapId): BasemapDef {
	const bm = BASEMAPS.find((b) => b.id === id);
	return bm ?? BASEMAPS[0];
}

export function isBasemapId(value: string): value is BasemapId {
	return BASEMAPS.some((b) => b.id === value);
}

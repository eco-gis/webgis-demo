// app/lib/maptiler/styles.ts
export type MapTilerStyleId = "streets-v2" | "satellite" | "outdoor" | "basic-v2" | "dataviz" | "ch-swisstopo-lbm";

const MAPTILER_STYLE_BASE = "https://api.maptiler.com/maps";

export function getMapTilerKey(): string {
	const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
	if (!key) throw new Error("Missing NEXT_PUBLIC_MAPTILER_KEY (.env.local).");
	return key;
}

export function mapTilerStyleUrl(styleId: MapTilerStyleId): string {
	const key = getMapTilerKey();
	return `${MAPTILER_STYLE_BASE}/${styleId}/style.json?key=${key}`;
}

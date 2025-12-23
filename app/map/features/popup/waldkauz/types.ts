// app/map/popups/waldkauz/types.ts
import type * as maplibregl from "maplibre-gl";

export type PresenceSeriesPoint = {
	t: string; // "YYYY-MM-DDTHH:MM"
	value: number;
};

export type PresenceBucketJson = {
	sourceCsv: string;
	site: string | null;
	year: number | null;
	month: number | null;
	bucketMinutes: number;
	metric: "presence_minutes";
	totalPresenceMinutes: number;
	series: PresenceSeriesPoint[];
};

export type LoadState<T> =
	| { kind: "idle" }
	| { kind: "loading" }
	| { kind: "error"; message: string }
	| { kind: "ready"; data: T };

export function getStringProp(feature: maplibregl.MapGeoJSONFeature, key: string): string | null {
	const v = feature.properties?.[key];
	return typeof v === "string" && v.trim() ? v : null;
}

export function getNumberProp(feature: maplibregl.MapGeoJSONFeature, key: string): number | null {
	const v = feature.properties?.[key];
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (typeof v === "string") {
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

export function formatTime(sec: number): string {
	if (!Number.isFinite(sec) || sec < 0) return "0:00";
	const m = Math.floor(sec / 60);
	const s = Math.floor(sec % 60);
	return `${m}:${s.toString().padStart(2, "0")}`;
}

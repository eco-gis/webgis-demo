export type PresenceSeriesPoint = {
	t: string; // "YYYY-MM-DDTHH:MM"
	value: number; // Anzahl Minuten mit presence=1 in diesem Bucket
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

const cache = new Map<string, PresenceBucketJson>();

export async function loadPresenceBucketJson(fileBase: string): Promise<PresenceBucketJson> {
	const key = fileBase.trim();
	const cached = cache.get(key);
	if (cached) return cached;

	const res = await fetch(`/data/json/${encodeURIComponent(key)}.json`, { cache: "force-cache" });
	if (!res.ok) {
		throw new Error(`Failed to load JSON: ${key}.json (${res.status})`);
	}

	const json: unknown = await res.json();
	// Minimale Runtime-Checks (ohne any)
	if (
		typeof json !== "object" ||
		json === null ||
		!("series" in json) ||
		!Array.isArray((json as { series: unknown }).series)
	) {
		throw new Error(`Invalid JSON schema: ${key}.json`);
	}

	const parsed = json as PresenceBucketJson;
	cache.set(key, parsed);
	return parsed;
}

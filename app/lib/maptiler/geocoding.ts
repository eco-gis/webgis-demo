export type GeocodingFeature = {
	id: string;
	place_name: string;
	text: string;
	center: [number, number];
	bbox?: [number, number, number, number];
	geometry?: {
		type: "Point";
		coordinates: [number, number];
	};
	properties?: Record<string, unknown>;
};

type GeocodingResponse = {
	type: "FeatureCollection";
	features: GeocodingFeature[];
};

export type GeocodeOptions = {
	limit?: number;
	language?: string;
	country?: string; // e.g. "ch"
	signal?: AbortSignal;
};

function getKey(): string {
	const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
	if (!key) throw new Error("Missing NEXT_PUBLIC_MAPTILER_KEY");
	return key;
}

export async function geocode(query: string, opts: GeocodeOptions = {}): Promise<GeocodingFeature[]> {
	const q = query.trim();
	if (!q) return [];

	const key = getKey();
	const limit = opts.limit ?? 8;

	const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json`);
	url.searchParams.set("key", key);
	url.searchParams.set("limit", String(limit));
	if (opts.language) url.searchParams.set("language", opts.language);
	if (opts.country) url.searchParams.set("country", opts.country);

	const res = await fetch(url.toString(), { signal: opts.signal });
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`Geocoding failed (${res.status}): ${text || res.statusText}`);
	}

	const data = (await res.json()) as GeocodingResponse;
	return Array.isArray(data.features) ? data.features : [];
}

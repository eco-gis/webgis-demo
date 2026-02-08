// app/lib/api/queries.ts
/**
 * TanStack Query Hooks für API-Aufrufe
 */

import { useQuery } from "@tanstack/react-query";

/**
 * Query Keys für besseres Caching
 */
export const queryKeys = {
	geocoding: (query: string) => ["geocoding", query] as const,
	presenceData: (fileBase: string) => ["presence", fileBase] as const,
	swisstopoCatalog: () => ["swisstopo", "catalog"] as const,
	swisstopoPidentify: (params: string) => ["swisstopo", "identify", params] as const,
} as const;

/**
 * Geocoding Query Hook
 * @example
 * const { data, isLoading } = useGeocodingQuery("Zürich");
 */
export function useGeocodingQuery(query: string, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: queryKeys.geocoding(query),
		queryFn: async () => {
			if (!query.trim()) return [];

			const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
			if (!apiKey) throw new Error("MapTiler API Key fehlt");

			const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&language=de&fuzzyMatch=true&limit=8`;

			const res = await fetch(url);
			if (!res.ok) throw new Error(`Geocoding fehlgeschlagen: ${res.status}`);

			const data = await res.json();
			return data.features || [];
		},
		enabled: options?.enabled !== false && query.trim().length > 0,
		staleTime: 10 * 60 * 1000, // 10 Minuten Cache
	});
}

/**
 * Presence Data Query Hook (für Waldkauz-Plugin)
 * @example
 * const { data, isLoading } = usePresenceDataQuery("waldkauz_sep_2024");
 */
export function usePresenceDataQuery(fileBase: string | null, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: queryKeys.presenceData(fileBase || ""),
		queryFn: async () => {
			if (!fileBase) throw new Error("FileBase ist null");

			const res = await fetch(`/data/plugins/waldkauz/json/${encodeURIComponent(fileBase)}.json`, {
				cache: "force-cache",
			});

			if (!res.ok) throw new Error(`Daten nicht verfügbar (${res.status})`);

			return await res.json();
		},
		enabled: options?.enabled !== false && !!fileBase,
		staleTime: Number.POSITIVE_INFINITY, // Presence-Daten ändern sich nie
	});
}

/**
 * Swisstopo Catalog Query Hook
 */
export function useSwisstoposCatalogQuery(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: queryKeys.swisstopoCatalog(),
		queryFn: async () => {
			const res = await fetch("https://api3.geo.admin.ch/rest/services/api/MapServer/layersConfig?lang=de");
			if (!res.ok) throw new Error(`Swisstopo Catalog fehlgeschlagen: ${res.status}`);
			return await res.json();
		},
		enabled: options?.enabled,
		staleTime: 60 * 60 * 1000, // 1 Stunde Cache
	});
}

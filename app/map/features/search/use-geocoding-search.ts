"use client";

import { type GeocodingFeature, geocode } from "@/app/lib/maptiler/geocoding";
import { useEffect, useMemo, useRef, useState } from "react";

export type UseGeocodingSearchState = {
	query: string;
	setQuery: (v: string) => void;
	results: GeocodingFeature[];
	isLoading: boolean;
	error: string | null;
};

export function useGeocodingSearch(): UseGeocodingSearchState {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<GeocodingFeature[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const abortRef = useRef<AbortController | null>(null);

	const debouncedQuery = useMemo(() => query.trim(), [query]);

	useEffect(() => {
		if (!debouncedQuery) {
			abortRef.current?.abort();
			abortRef.current = null;
			setResults([]);
			setIsLoading(false);
			setError(null);
			return;
		}

		setIsLoading(true);
		setError(null);

		const t = window.setTimeout(async () => {
			abortRef.current?.abort();
			const ac = new AbortController();
			abortRef.current = ac;

			try {
				const feats = await geocode(debouncedQuery, {
					limit: 8,
					language: "de",
					country: "ch",
					signal: ac.signal,
				});
				setResults(feats);
			} catch (e) {
				if (ac.signal.aborted) return;
				const msg = e instanceof Error ? e.message : "Unknown geocoding error";
				setError(msg);
				setResults([]);
			} finally {
				if (!ac.signal.aborted) setIsLoading(false);
			}
		}, 250);

		return () => window.clearTimeout(t);
	}, [debouncedQuery]);

	return { query, setQuery, results, isLoading, error };
}

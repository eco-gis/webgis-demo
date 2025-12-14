// app/map/basemaps/basemap-store.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BasemapId } from "./basemap-config";
import { BASEMAPS, isBasemapId } from "./basemap-config";

const STORAGE_KEY = "biodiv-demo:basemapId";

function safeReadStoredBasemapId(): BasemapId | null {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw && isBasemapId(raw) ? raw : null;
	} catch {
		return null;
	}
}

function safeWriteStoredBasemapId(id: BasemapId): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, id);
	} catch {
		// ignore
	}
}

export type BasemapStore = {
	basemapId: BasemapId;
	setBasemapId: (id: BasemapId) => void;
	options: typeof BASEMAPS;
	isHydrated: boolean;
};

export function useBasemapStore(
	fallback: BasemapId = "swisstopo-lbm",
): BasemapStore {
	// ✅ SSR/Client consistent: start with fallback always
	const [basemapId, setBasemapIdState] = useState<BasemapId>(fallback);
	const [isHydrated, setIsHydrated] = useState(false);

	// ✅ After mount: read localStorage and apply
	useEffect(() => {
		const stored = safeReadStoredBasemapId();
		if (stored) setBasemapIdState(stored);
		setIsHydrated(true);
	}, []);

	const setBasemapId = useCallback((id: BasemapId) => {
		setBasemapIdState(id);
		safeWriteStoredBasemapId(id);
	}, []);

	const options = useMemo(() => BASEMAPS, []);

	return { basemapId, setBasemapId, options, isHydrated };
}

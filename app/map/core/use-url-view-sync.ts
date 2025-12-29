// app/map/core/use-url-view-sync.ts
"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { readViewFromUrl, type UrlView, writeViewToUrl } from "./url-view";

type UrlViewSyncOptions = {
	applyOnLoad?: boolean; // default true
	updateUrl?: boolean; // default true
	includeOrientation?: boolean; // default true
};

function getCurrentView(map: MapLibreMap, includeOrientation: boolean): UrlView {
	const c = map.getCenter();
	return {
		lon: c.lng,
		lat: c.lat,
		zoom: map.getZoom(),
		...(includeOrientation ? { bearing: map.getBearing(), pitch: map.getPitch() } : {}),
	};
}

export function useUrlViewSync(map: MapLibreMap | null, opts?: UrlViewSyncOptions): void {
	const applyOnLoad = opts?.applyOnLoad ?? true;
	const updateUrl = opts?.updateUrl ?? true;
	const includeOrientation = opts?.includeOrientation ?? true;

	const didApplyInitialRef = useRef(false);

	useEffect(() => {
		if (!map || !applyOnLoad) return;
		if (didApplyInitialRef.current) return;

		const v = readViewFromUrl(window.location.search);
		if (!v) {
			didApplyInitialRef.current = true;
			return;
		}

		const apply = () => {
			map.jumpTo({
				center: [v.lon, v.lat],
				zoom: v.zoom,
				bearing: includeOrientation ? v.bearing : undefined,
				pitch: includeOrientation ? v.pitch : undefined,
			});
			didApplyInitialRef.current = true;
		};

		// ✅ bei dir stabiler: erst wenn App-Setup durch ist
		map.once("app.layers.ready", apply);

		// Fallback: falls das Event schon vorbei war (race), dann sofort versuchen
		// (keine perfekte "has fired" Abfrage, aber praktisch: wenn style loaded, apply)
		if (map.isStyleLoaded()) {
			// queue microtask, damit andere init-effects zuerst laufen
			queueMicrotask(() => {
				if (!didApplyInitialRef.current) apply();
			});
		}

		return () => {
			map.off("app.layers.ready", apply);
		};
	}, [map, applyOnLoad, includeOrientation]);

	useEffect(() => {
		if (!map || !updateUrl) return;

		const onMoveEnd = () => {
			const v = getCurrentView(map, includeOrientation);
			const nextSearch = writeViewToUrl(v, window.location.search);
			const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
			window.history.replaceState(null, "", nextUrl);
		};

		map.on("moveend", onMoveEnd);
		return () => {
			map.off("moveend", onMoveEnd);
		};
	}, [map, updateUrl, includeOrientation]);
}

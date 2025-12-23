// app/map/basemaps/use-basemap-sync.ts
"use client";

import type { Map as MaplibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { type MapTilerStyleId, mapTilerStyleUrl } from "@/app/lib/maptiler/styles";
import type { BasemapId } from "./basemap-config";
import { getBasemapById } from "./basemap-config";

export function useBasemapSync(
	map: MaplibreMap | null,
	basemapId: BasemapId,
	opts?: {
		enabled?: boolean;
		initialStyleId?: MapTilerStyleId;
	},
): void {
	const enabled = opts?.enabled ?? true;
	const initialStyleId = opts?.initialStyleId ?? "ch-swisstopo-lbm";

	const lastStyleUrlRef = useRef<string>(mapTilerStyleUrl(initialStyleId));
	const reqIdRef = useRef(0);

	useEffect(() => {
		const m = map;
		if (!m || !enabled) return;

		const def = getBasemapById(basemapId);
		const nextStyleUrl = mapTilerStyleUrl(def.styleId as MapTilerStyleId);

		if (lastStyleUrlRef.current === nextStyleUrl) return;

		const currentReqId = ++reqIdRef.current;
		let finished = false;

		const cleanup = () => {
			m.off("style.load", onStyleLoad);
			m.off("styledata", onStyleData);
			m.off("idle", onIdle);
			m.off("error", onError);
		};

		const finalize = () => {
			if (finished) return;
			finished = true;

			// ignore stale requests
			if (currentReqId !== reqIdRef.current) {
				cleanup();
				return;
			}

			// notify use-maplibre.ts to re-apply overlays (+ reorder there)
			m.fire("basemap.ready");
			cleanup();
		};

		const onStyleLoad = () => finalize();
		const onStyleData = () => {
			if (!m.isStyleLoaded()) return;
			finalize();
		};
		const onIdle = () => {
			if (!m.isStyleLoaded()) return;
			finalize();
		};
		const onError = () => {
			// no-op (avoid logs in final version)
		};

		// Register handlers BEFORE setStyle
		m.on("style.load", onStyleLoad);
		m.on("styledata", onStyleData);
		m.on("idle", onIdle);
		m.on("error", onError);

		// Update ref immediately so fast switches work correctly
		lastStyleUrlRef.current = nextStyleUrl;

		m.setStyle(nextStyleUrl);

		return cleanup;
	}, [map, basemapId, enabled]);
}

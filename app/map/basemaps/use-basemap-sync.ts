"use client";

import {
	type MapTilerStyleId,
	mapTilerStyleUrl,
} from "@/app/lib/maptiler/styles";
import { reorderAppLayers } from "@/app/map/core/layer-order";
import type { Map as MaplibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { BasemapId } from "./basemap-config";
import { getBasemapById } from "./basemap-config";

export function useBasemapSync(
	map: MaplibreMap | null,
	basemapId: BasemapId,
): void {
	const runRef = useRef(0);

	useEffect(() => {
		if (!map) return;

		let cancelled = false;
		const run = ++runRef.current;

		const handleStyleChange = async () => {
			const def = getBasemapById(basemapId);
			const nextStyleUrl = mapTilerStyleUrl(def.styleId as MapTilerStyleId);

			// 1. Neuen Style setzen (Löscht alles!)
			map.setStyle(nextStyleUrl);

			// 2. Warten, bis der Style geladen ist
			const onStyleLoad = () => {
				if (cancelled || run !== runRef.current) return;

				map.fire("style.reinit"); // Custom Event, falls nötig
				reorderAppLayers(map);
			};

			map.once("style.load", onStyleLoad);
		};

		handleStyleChange();

		return () => {
			cancelled = true;
		};
	}, [map, basemapId]);
}

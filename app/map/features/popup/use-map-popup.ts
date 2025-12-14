// app/map/features/popup/use-map-popup.ts
"use client";

import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { useEffect, useState } from "react";
import type { MapPopupData } from "./types";

type UseMapPopupOptions = {
	map: MapLibreMap | null;
	layerIds: readonly string[];
};

export function useMapPopup({ map, layerIds }: UseMapPopupOptions) {
	const [popup, setPopup] = useState<MapPopupData | null>(null);

	useEffect(() => {
		if (!map) return;

		const onClick = (e: MapMouseEvent) => {
			const features = map.queryRenderedFeatures(e.point, {
				layers: [...layerIds],
			});
			if (features.length === 0) {
				setPopup(null);
				return;
			}

			setPopup({
				lngLat: e.lngLat,
				features,
			});
		};

		map.on("click", onClick);
		return () => {
			map.off("click", onClick);
		};
	}, [map, layerIds]);

	return {
		popup,
		close: () => setPopup(null),
	};
}

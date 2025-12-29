// app/map/features/coords/use-rightclick-coordinates.ts
"use client";

import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import { type Lv95, wgs84ToLv95 } from "./lv95";

export type ClickCoordsState =
	| { kind: "closed" }
	| {
			kind: "open";
			screen: { x: number; y: number };
			wgs84: { lon: number; lat: number };
			lv95: Lv95;
			view: { zoom: number; bearing: number; pitch: number };
	  };

export function useRightClickCoordinates(map: MapLibreMap | null) {
	const [state, setState] = useState<ClickCoordsState>({ kind: "closed" });

	const close = useCallback(() => setState({ kind: "closed" }), []);

	useEffect(() => {
		if (!map) return;

		const onContextMenu = (e: MapMouseEvent) => {
			e.preventDefault();

			const lon = e.lngLat.lng;
			const lat = e.lngLat.lat;

			setState({
				kind: "open",
				screen: { x: e.point.x, y: e.point.y },
				wgs84: { lon, lat },
				lv95: wgs84ToLv95(lon, lat),
				view: { zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() },
			});
		};

		map.on("contextmenu", onContextMenu);
		map.on("click", close);
		map.on("dragstart", close);

		return () => {
			map.off("contextmenu", onContextMenu);
			map.off("click", close);
			map.off("dragstart", close);
		};
	}, [map, close]);

	return { state, close };
}

"use client";

import type maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { DRAW_LAYERS, DRAW_SOURCE, DRAW_SOURCE_ID } from "./draw-layer";
import { DrawManager } from "./draw-manager";
import { createDrawState } from "./draw-state";

function ensureDrawLayers(map: maplibregl.Map): void {
	if (!map.getSource(DRAW_SOURCE_ID))
		map.addSource(DRAW_SOURCE_ID, DRAW_SOURCE);

	for (const layer of DRAW_LAYERS) {
		if (!map.getLayer(layer.id)) map.addLayer(layer);
	}
}

export function useDrawing(map: maplibregl.Map | null) {
	const state = useMemo(() => createDrawState(), []);
	const [version, setVersion] = useState(0); // re-render trigger
	const mgrRef = useRef<DrawManager | null>(null);

	useEffect(() => {
		if (!map) return;

		ensureDrawLayers(map);

		// manager (re)create
		mgrRef.current?.destroy();
		mgrRef.current = new DrawManager(map, state, () =>
			setVersion((v) => v + 1),
		);

		return () => {
			mgrRef.current?.destroy();
			mgrRef.current = null;
		};
	}, [map, state]);

	const isDrawing = state.isDrawing;

	function toggleDrawing(): void {
		state.isDrawing = !state.isDrawing;
		setVersion((v) => v + 1);
	}

	function reset(): void {
		mgrRef.current?.reset();
	}

	return { isDrawing, toggleDrawing, reset, version };
}

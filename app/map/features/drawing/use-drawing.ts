// app/map/features/drawing/use-drawing.ts
"use client";

import type maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { ensureArrowIcon } from "./draw-icons";
import {
	DRAW_DATA_SOURCE_ID,
	DRAW_LAYERS,
	DRAW_SKETCH_SOURCE_ID,
	DRAW_SOURCES,
} from "./draw-layers";
import type { DrawCollection, DrawKind, DrawMode } from "./draw-types";

type LngLat = [number, number];

function newId(): string {
	return crypto.randomUUID();
}

type SketchFeatureCollection = {
	type: "FeatureCollection";
	features: Array<{
		type: "Feature";
		properties: Record<string, unknown>;
		geometry:
			| { type: "Point"; coordinates: LngLat }
			| { type: "LineString"; coordinates: LngLat[] }
			| { type: "Polygon"; coordinates: LngLat[][] };
	}>;
};

function buildSketchGeoJson(params: {
	mode: DrawMode;
	coords: LngLat[];
	hover: LngLat | null;
}): SketchFeatureCollection {
	const { mode, coords, hover } = params;

	if (mode === "select" || mode === "point") {
		return { type: "FeatureCollection", features: [] };
	}

	if (coords.length === 0) {
		return { type: "FeatureCollection", features: [] };
	}

	const withHover =
		hover && coords.length >= 1 ? [...coords, hover] : [...coords];

	const features: SketchFeatureCollection["features"] = [];

	if (withHover.length >= 2) {
		let lineCoords = withHover;

		if (mode === "polygon" && coords.length >= 2 && hover) {
			lineCoords = [...coords, hover, coords[0]];
		}

		features.push({
			type: "Feature",
			properties: { kind: "sketch-line" },
			geometry: { type: "LineString", coordinates: lineCoords },
		});
	}

	if (mode === "polygon" && hover) {
		const ring = [...coords, hover];

		if (ring.length >= 3) {
			features.push({
				type: "Feature",
				properties: { kind: "sketch-polygon" },
				geometry: {
					type: "Polygon",
					coordinates: [[...ring, ring[0]]],
				},
			});
		}
	}

	return { type: "FeatureCollection", features };
}

function setGeoJsonSourceData(
	map: maplibregl.Map,
	sourceId: string,
	data: GeoJSON.FeatureCollection,
): void {
	const src = map.getSource(sourceId);
	if (src && "setData" in src) {
		(src as maplibregl.GeoJSONSource).setData(data);
	}
}

export function useDrawing(map: maplibregl.Map | null) {
	const [mode, setMode] = useState<DrawMode>("select");
	const [version, setVersion] = useState(0);

	const dataRef = useRef<DrawCollection>({
		type: "FeatureCollection",
		features: [],
	});

	const sketchRef = useRef<LngLat[]>([]);
	const hoverRef = useRef<LngLat | null>(null);

	const labelRef = useRef<string>("");

	const commitRef = useRef<(kind: DrawKind) => void>(() => {});
	const updateSourcesRef = useRef<() => void>(() => {});

	/* ------------------------------------------------------------------ */
	/* Setup: Sources + Layers + Icons (MUSS nach jedem setStyle() neu)    */
	/* ------------------------------------------------------------------ */
	useEffect(() => {
		if (!map) return;

		let cancelled = false;

		const rehydrate = () => {
			// Persistierte Daten wieder in die neuen Sources schreiben
			setGeoJsonSourceData(map, DRAW_DATA_SOURCE_ID, dataRef.current);

			const sketch = buildSketchGeoJson({
				mode,
				coords: sketchRef.current,
				hover: hoverRef.current,
			});
			setGeoJsonSourceData(map, DRAW_SKETCH_SOURCE_ID, sketch);

			setVersion((v) => v + 1);
		};

		const setup = async () => {
			// Sources
			for (const [id, src] of Object.entries(DRAW_SOURCES)) {
				if (!map.getSource(id)) map.addSource(id, src);
			}

			// Layers (nach Stylewechsel sind sie weg)
			for (const layer of DRAW_LAYERS) {
				if (!map.getLayer(layer.id)) map.addLayer(layer);
			}

			// Icons/Sprite wird bei setStyle() zurückgesetzt -> erneut sicherstellen
			await ensureArrowIcon(map);

			// Daten wieder einhängen
			rehydrate();
		};

		const runSetup = () => {
			void setup().catch((err: unknown) => {
				if (cancelled) return;
				console.error("Drawing setup failed:", err);
			});
		};

		// initial
		if (map.isStyleLoaded()) runSetup();
		else map.once("load", runSetup);

		// after every basemap switch / style load
		const onStyleLoad = () => runSetup();
		map.on("style.load", onStyleLoad);

		return () => {
			cancelled = true;
			map.off("style.load", onStyleLoad);
		};
		// mode absichtlich drin: Sketch-Preview nach Setup korrekt
	}, [map, mode]);

	/* ------------------------------------------------------------------ */
	/* Cursor + Map-Interaktion (UX)                                       */
	/* ------------------------------------------------------------------ */
	useEffect(() => {
		if (!map) return;

		const canvas = map.getCanvas();
		const prevCursor = canvas.style.cursor;

		const panWasEnabled = map.dragPan.isEnabled();
		const dblWasEnabled = map.doubleClickZoom.isEnabled();

		if (mode === "select") {
			canvas.style.cursor = "";
			if (panWasEnabled) map.dragPan.enable();
			if (dblWasEnabled) map.doubleClickZoom.enable();
		} else {
			canvas.style.cursor = "crosshair";
			if (panWasEnabled) map.dragPan.disable();
			if (dblWasEnabled) map.doubleClickZoom.disable();
		}

		return () => {
			canvas.style.cursor = prevCursor;
			if (panWasEnabled) map.dragPan.enable();
			if (dblWasEnabled) map.doubleClickZoom.enable();
		};
	}, [map, mode]);

	/* ------------------------------------------------------------------ */
	/* Drawing Logic + Live Preview                                         */
	/* ------------------------------------------------------------------ */
	useEffect(() => {
		if (!map) return;

		const updateSources = () => {
			setGeoJsonSourceData(map, DRAW_DATA_SOURCE_ID, dataRef.current);

			const sketch = buildSketchGeoJson({
				mode,
				coords: sketchRef.current,
				hover: hoverRef.current,
			});
			setGeoJsonSourceData(map, DRAW_SKETCH_SOURCE_ID, sketch);

			setVersion((v) => v + 1);
		};

		updateSourcesRef.current = updateSources;

		const commit = (kind: DrawKind) => {
			const coords = sketchRef.current;
			if (!coords.length) return;

			if (kind === "point") {
				dataRef.current.features.push({
					type: "Feature",
					properties: {
						id: newId(),
						kind,
						label: labelRef.current || undefined,
					},
					geometry: { type: "Point", coordinates: coords[0] },
				});
			} else if (kind === "line" || kind === "arrow") {
				if (coords.length < 2) return;
				dataRef.current.features.push({
					type: "Feature",
					properties: { id: newId(), kind },
					geometry: { type: "LineString", coordinates: coords },
				});
			} else {
				if (coords.length < 3) return;
				dataRef.current.features.push({
					type: "Feature",
					properties: { id: newId(), kind: "polygon" },
					geometry: {
						type: "Polygon",
						coordinates: [[...coords, coords[0]]],
					},
				});
			}

			sketchRef.current = [];
			hoverRef.current = null;

			updateSources();
		};

		commitRef.current = commit;

		const onClick = (e: maplibregl.MapMouseEvent) => {
			if (mode === "select") return;

			const pt: LngLat = [e.lngLat.lng, e.lngLat.lat];
			sketchRef.current = [...sketchRef.current, pt];

			if (mode === "point") {
				commit("point");
			} else {
				updateSources();
			}
		};

		const onDblClick = (e: maplibregl.MapMouseEvent) => {
			if (mode !== "select") {
				e.preventDefault();
				commit(mode as DrawKind);
			}
		};

		let rafId: number | null = null;

		const scheduleUpdate = () => {
			if (rafId != null) return;
			rafId = window.requestAnimationFrame(() => {
				rafId = null;
				updateSources();
			});
		};

		const onMouseMove = (e: maplibregl.MapMouseEvent) => {
			if (mode === "select" || mode === "point") return;
			if (sketchRef.current.length === 0) return;

			hoverRef.current = [e.lngLat.lng, e.lngLat.lat];
			scheduleUpdate();
		};

		const onMouseLeave = () => {
			if (mode === "select" || mode === "point") return;
			if (hoverRef.current) {
				hoverRef.current = null;
				updateSources();
			}
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				sketchRef.current = [];
				hoverRef.current = null;
				updateSources();
			}
			if (e.key === "Enter") {
				if (mode !== "select") commit(mode as DrawKind);
			}
		};

		map.on("click", onClick);
		map.on("dblclick", onDblClick);
		map.on("mousemove", onMouseMove);
		map.on("mouseout", onMouseLeave);

		window.addEventListener("keydown", onKeyDown);

		return () => {
			map.off("click", onClick);
			map.off("dblclick", onDblClick);
			map.off("mousemove", onMouseMove);
			map.off("mouseout", onMouseLeave);

			window.removeEventListener("keydown", onKeyDown);

			if (rafId != null) window.cancelAnimationFrame(rafId);
		};
	}, [map, mode]);

	/* ------------------------------------------------------------------ */
	/* Public API                                                         */
	/* ------------------------------------------------------------------ */
	return {
		mode,
		setMode,

		setLabel: (v: string) => {
			labelRef.current = v;
			updateSourcesRef.current();
		},

		sketchCount: sketchRef.current.length,
		hasSketch: sketchRef.current.length > 0,
		hasFeatures: dataRef.current.features.length > 0,

		undoLast: () => {
			sketchRef.current = sketchRef.current.slice(0, -1);
			updateSourcesRef.current();
		},

		finish: () => {
			if (mode !== "select") commitRef.current(mode as DrawKind);
		},

		cancel: () => {
			sketchRef.current = [];
			hoverRef.current = null;
			updateSourcesRef.current();
		},

		clearAll: () => {
			dataRef.current.features = [];
			sketchRef.current = [];
			hoverRef.current = null;
			updateSourcesRef.current();
		},

		version,
	};
}

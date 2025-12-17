// app/map/features/drawing/use-drawing.ts
"use client";

import * as turf from "@turf/turf";
import type maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
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

	// 1. Early return for modes that don't need a preview
	if (mode === "select" || mode === "point" || coords.length === 0) {
		return { type: "FeatureCollection", features: [] };
	}

	const features: SketchFeatureCollection["features"] = [];

	// 2. Handle Line/Arrow Preview
	// Only include hover in the line if it actually exists
	const lineCoords: LngLat[] = hover ? [...coords, hover] : [...coords];

	// If it's a polygon, we close the visual loop to the first point
	let displayLineCoords = lineCoords;
	if (mode === "polygon" && hover) {
		displayLineCoords = [...coords, hover, coords[0]];
	}

	features.push({
		type: "Feature",
		properties: { kind: "sketch-line" },
		geometry: { type: "LineString", coordinates: displayLineCoords },
	});

	// 3. Handle Polygon Fill Preview
	// We only create the 'Polygon' feature if we are in polygon mode and have a hover point
	if (mode === "polygon" && hover) {
		const ring: LngLat[] = [...coords, hover, coords[0]];
		features.push({
			type: "Feature",
			properties: { kind: "sketch-polygon" },
			geometry: { type: "Polygon", coordinates: [ring] },
		});
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

/**
 * Formatiert Messwerte:
 * - Flächen < 1000m² -> m², sonst km²
 * - Strecken < 1000m -> m, sonst km
 */
export function formatMeasurement(
	mode: string,
	feature: GeoJSON.Feature,
): string {
	if (!feature.geometry) return "";

	// FLÄCHEN (Polygon)
	if (mode === "polygon") {
		const area = turf.area(feature);

		if (area < 1000) {
			return `${Math.round(area).toLocaleString("de-CH")} m²`;
		}

		const sqkm = area / 1_000_000;
		return `${sqkm.toLocaleString("de-CH", {
			minimumFractionDigits: 3,
			maximumFractionDigits: 3,
		})} km²`;
	}

	// DISTANZEN (LineString / Arrow)
	try {
		const length = turf.length(
			feature as GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>,
			{ units: "meters" },
		);

		if (length < 1000) {
			return `${Math.round(length).toLocaleString("de-CH")} m`;
		}

		const km = length / 1000;
		return `${km.toLocaleString("de-CH", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})} km`;
	} catch {
		return "";
	}
}

export function useDrawing(map: maplibregl.Map | null) {
	const commitRef = useRef<(kind: DrawKind) => void>(() => {});
	const updateSourcesRef = useRef<() => void>(() => {});

	const [mode, setMode] = useState<DrawMode>("select");
	const [version, setVersion] = useState(0);

	const dataRef = useRef<DrawCollection>({
		type: "FeatureCollection",
		features: [],
	});
	const sketchRef = useRef<LngLat[]>([]);
	const hoverRef = useRef<LngLat | null>(null);
	const labelRef = useRef<string>("");

	// Berechnet das aktuelle "In-Arbeit" Feature für die Sidebar/Toolbar Anzeige
	const currentSketchFeature = useMemo(() => {
		void version; // Reaktivitätstrigger

		const coords = sketchRef.current;
		const hover = hoverRef.current;

		if (coords.length === 0) return null;

		const withHover = hover ? [...coords, hover] : coords;

		if (mode === "polygon" && withHover.length >= 3) {
			return {
				type: "Feature",
				geometry: {
					type: "Polygon",
					coordinates: [[...withHover, withHover[0]]],
				},
				properties: { kind: mode },
			} as GeoJSON.Feature;
		}

		if (withHover.length >= 2) {
			return {
				type: "Feature",
				geometry: {
					type: "LineString",
					coordinates: withHover,
				},
				properties: { kind: mode },
			} as GeoJSON.Feature;
		}

		return null;
	}, [mode, version]);

	const deleteFeature = (id: string) => {
		dataRef.current.features = dataRef.current.features.filter(
			(f) => f.properties?.id !== id,
		);
		updateSourcesRef.current();
	};

	/* --- Style & Layer Setup --- */
	useEffect(() => {
		if (!map) return;

		let cancelled = false;

		const rehydrate = () => {
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
			for (const [id, src] of Object.entries(DRAW_SOURCES)) {
				if (!map.getSource(id)) map.addSource(id, src);
			}
			for (const layer of DRAW_LAYERS) {
				if (!map.getLayer(layer.id)) map.addLayer(layer);
			}
			await ensureArrowIcon(map);
			rehydrate();
		};

		const runSetup = () => {
			void setup().catch((err: unknown) => {
				if (!cancelled) console.error("Drawing setup failed:", err);
			});
		};

		if (map.isStyleLoaded()) runSetup();
		else map.once("load", runSetup);

		map.on("style.load", runSetup);
		return () => {
			cancelled = true;
			map.off("style.load", runSetup);
		};
	}, [map, mode]);

	/* --- Interaction Logic --- */
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

			const baseProps = { id: newId(), kind, timestamp: Date.now() };

			if (kind === "point") {
				dataRef.current.features.push({
					type: "Feature",
					properties: { ...baseProps, label: labelRef.current || undefined },
					geometry: { type: "Point", coordinates: coords[0] },
				});
			} else if (kind === "line" || kind === "arrow") {
				if (coords.length < 2) return;
				dataRef.current.features.push({
					type: "Feature",
					properties: baseProps,
					geometry: { type: "LineString", coordinates: coords },
				});
			} else if (kind === "polygon") {
				if (coords.length < 3) return;
				dataRef.current.features.push({
					type: "Feature",
					properties: baseProps,
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

			if (mode === "point") commit("point");
			else updateSources();
		};

		const onDblClick = (e: maplibregl.MapMouseEvent) => {
			if (mode !== "select") {
				e.preventDefault();
				commit(mode as DrawKind);
			}
		};

		const onMouseMove = (e: maplibregl.MapMouseEvent) => {
			if (
				mode === "select" ||
				mode === "point" ||
				sketchRef.current.length === 0
			)
				return;

			hoverRef.current = [e.lngLat.lng, e.lngLat.lat];
			updateSources();
		};

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				sketchRef.current = [];
				hoverRef.current = null;
				updateSources();
			}
			if (e.key === "Enter" && mode !== "select") {
				commit(mode as DrawKind);
			}
		};

		map.on("click", onClick);
		map.on("dblclick", onDblClick);
		map.on("mousemove", onMouseMove);
		window.addEventListener("keydown", onKeyDown);

		return () => {
			map.off("click", onClick);
			map.off("dblclick", onDblClick);
			map.off("mousemove", onMouseMove);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [map, mode]);

	return {
		mode,
		setMode,
		currentSketch: currentSketchFeature,
		version,
		deleteFeature,
		hasSketch: sketchRef.current.length > 0,
		hasFeatures: dataRef.current.features.length > 0,
		allFeatures: dataRef.current.features,
		sketchCount: sketchRef.current.length,

		undoLast: () => {
			sketchRef.current = sketchRef.current.slice(0, -1);
			hoverRef.current = null;
			updateSourcesRef.current();
		},

		finish: () => {
			if (mode !== "select") {
				commitRef.current(mode as DrawKind);
				setMode("select");
			}
		},

		cancel: () => {
			sketchRef.current = [];
			hoverRef.current = null;
			setMode("select");
			updateSourcesRef.current();
		},

		clearAll: () => {
			dataRef.current.features = [];
			sketchRef.current = [];
			hoverRef.current = null;
			setMode("select");
			updateSourcesRef.current();
		},
	};
}

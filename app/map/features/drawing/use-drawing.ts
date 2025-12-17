"use client";

import * as turf from "@turf/turf";
import type maplibregl from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureArrowIcon } from "./draw-icons";
import {
	DRAW_DATA_SOURCE_ID,
	DRAW_LAYERS,
	DRAW_SKETCH_SOURCE_ID,
	DRAW_SOURCES,
} from "./draw-layers";

/** --- Types --- */

type LngLat = [number, number];

export type DrawMode =
	| "select"
	| "measure-line"
	| "measure-polygon"
	| "draw-point"
	| "draw-line"
	| "draw-arrow"
	| "draw-polygon";

export type DrawKind = "line" | "polygon" | "point" | "arrow";
export type ToolUsage = "measure" | "draw";

/** --- Hilfsfunktionen --- */

function newId(): string {
	return crypto.randomUUID();
}

export function formatMeasurement(
	mode: string,
	feature: GeoJSON.Feature,
): string {
	if (!feature.geometry) return "";

	const isPolygon =
		mode.includes("polygon") || feature.properties?.kind === "polygon";

	if (isPolygon) {
		const area = turf.area(feature);
		return area < 1_000_000
			? `${Math.round(area).toLocaleString("de-CH")} m²`
			: `${(area / 1_000_000).toLocaleString("de-CH", {
					maximumFractionDigits: 2,
				})} km²`;
	}

	const lengthM = turf.length(
		feature as GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString>,
		{ units: "meters" },
	);

	return lengthM < 1000
		? `${Math.round(lengthM).toLocaleString("de-CH")} m`
		: `${(lengthM / 1000).toLocaleString("de-CH", {
				maximumFractionDigits: 2,
			})} km`;
}

function buildSketchGeoJson(params: {
	mode: DrawMode;
	coords: LngLat[];
	hover: LngLat | null;
}): GeoJSON.FeatureCollection {
	const { mode, coords, hover } = params;

	if (mode === "select" || mode === "draw-point" || coords.length === 0) {
		return { type: "FeatureCollection", features: [] };
	}

	const features: GeoJSON.Feature[] = [];
	const isPolygon = mode.endsWith("polygon");
	const isArrow = mode.endsWith("arrow");

	const displayLineCoords = hover ? [...coords, hover] : [...coords];
	const lineGeometryCoords =
		isPolygon && hover ? [...coords, hover, coords[0]] : displayLineCoords;

	features.push({
		type: "Feature",
		properties: {
			kind: isArrow ? "arrow" : "sketch-line",
			usage: mode.startsWith("measure") ? "measure" : "draw",
		},
		geometry: { type: "LineString", coordinates: lineGeometryCoords },
	});

	if (isPolygon && hover && coords.length >= 2) {
		features.push({
			type: "Feature",
			properties: { kind: "sketch-polygon" },
			geometry: {
				type: "Polygon",
				coordinates: [[...coords, hover, coords[0]]],
			},
		});
	}

	return { type: "FeatureCollection", features };
}

function buildCurrentSketchFeature(params: {
	mode: DrawMode;
	coords: LngLat[];
	hover: LngLat | null;
}): GeoJSON.Feature | null {
	const { mode, coords, hover } = params;
	const combined = hover ? [...coords, hover] : [...coords];

	if (mode === "select" || combined.length === 0) return null;

	const isPolygon = mode.endsWith("polygon");

	if (isPolygon && combined.length >= 3) {
		return {
			type: "Feature",
			properties: { kind: "polygon" },
			geometry: { type: "Polygon", coordinates: [[...combined, combined[0]]] },
		};
	}
	if (combined.length >= 2) {
		return {
			type: "Feature",
			properties: { kind: mode.endsWith("arrow") ? "arrow" : "line" },
			geometry: { type: "LineString", coordinates: combined },
		};
	}
	if (mode === "draw-point" && combined.length > 0) {
		return {
			type: "Feature",
			properties: { kind: "point" },
			geometry: { type: "Point", coordinates: combined[0] },
		};
	}
	return null;
}

/** --- Hook --- */

export function useDrawing(map: maplibregl.Map | null) {
	const [mode, setMode] = useState<DrawMode>("select");
	const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
	const [sketchTick, setSketchTick] = useState(0);

	const sketchRef = useRef<LngLat[]>([]);
	const hoverRef = useRef<LngLat | null>(null);

	/**
	 * Schreibt die aktuellen Daten (State & Refs) in die Map-Sources
	 */
	const updateSources = useCallback(() => {
		if (!map || !map.getStyle()) return;

		const srcData = map.getSource(DRAW_DATA_SOURCE_ID) as
			| maplibregl.GeoJSONSource
			| undefined;
		const srcSketch = map.getSource(DRAW_SKETCH_SOURCE_ID) as
			| maplibregl.GeoJSONSource
			| undefined;

		if (srcData) {
			srcData.setData({ type: "FeatureCollection", features });
		}

		if (srcSketch) {
			srcSketch.setData(
				buildSketchGeoJson({
					mode,
					coords: sketchRef.current,
					hover: hoverRef.current,
				}),
			);
		}
	}, [map, mode, features]);

	/**
	 * Initialisierung und "Style-Safe" Re-Injektion der Layer
	 */
	useEffect(() => {
		if (!map) return;

		const setupLayers = async () => {
			// WICHTIG: Wenn der Map-Renderer gerade beschäftigt ist,
			// warten wir kurz, bis er "idle" ist.
			if (!map.getStyle() || !map.isStyleLoaded()) return;

			let needsUpdate = false;

			// Sources nur hinzufügen, wenn sie wirklich fehlen
			for (const [id, src] of Object.entries(DRAW_SOURCES)) {
				if (!map.getSource(id)) {
					map.addSource(id, src as maplibregl.SourceSpecification);
					needsUpdate = true;
				}
			}

			// Layer nur hinzufügen, wenn sie wirklich fehlen
			for (const layer of DRAW_LAYERS) {
				if (!map.getLayer(layer.id)) {
					map.addLayer(layer as maplibregl.LayerSpecification);
					needsUpdate = true;
				}
			}

			if (needsUpdate) {
				await ensureArrowIcon(map);
				updateSources();
			}
		};

		// 'styledata' ist zu aggressiv. 'style.load' ist sicherer für
		// das Wiederherstellen von Layern nach einem Basemap-Wechsel.
		map.on("style.load", setupLayers);

		// Initialer Check
		if (map.isStyleLoaded()) {
			void setupLayers();
		}

		return () => {
			map.off("style.load", setupLayers);
		};
	}, [map, updateSources]);

	/**
	 * Skizze abschließen
	 */
	const commit = useCallback(() => {
		const coords = sketchRef.current;
		if (!coords.length || mode === "select") return;

		const [usage, kind] = mode.split("-") as [ToolUsage, DrawKind];
		const baseProps = { id: newId(), kind, usage, timestamp: Date.now() };

		let newFeature: GeoJSON.Feature | null = null;

		if (kind === "point") {
			newFeature = {
				type: "Feature",
				properties: baseProps,
				geometry: { type: "Point", coordinates: coords[0] },
			};
		} else if (kind === "line" || kind === "arrow") {
			if (coords.length >= 2) {
				newFeature = {
					type: "Feature",
					properties: baseProps,
					geometry: { type: "LineString", coordinates: coords },
				};
			}
		} else if (kind === "polygon") {
			if (coords.length >= 3) {
				newFeature = {
					type: "Feature",
					properties: baseProps,
					geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
				};
			}
		}

		if (newFeature) {
			setFeatures((prev) => [...prev, newFeature as GeoJSON.Feature]);
		}

		sketchRef.current = [];
		hoverRef.current = null;
		setSketchTick((v) => v + 1);
		// Wir rufen updateSources hier nicht direkt auf, da useEffect[features] es übernimmt
	}, [mode]);

	// Triggert Map-Update bei State-Änderung (Biome-konform)
	useEffect(() => {
		updateSources();
	}, [updateSources]);

	/**
	 * Map Interaktionen
	 */
	useEffect(() => {
		if (!map) return;

		const onClick = (e: maplibregl.MapMouseEvent) => {
			if (mode === "select") return;
			sketchRef.current = [...sketchRef.current, [e.lngLat.lng, e.lngLat.lat]];

			if (mode === "draw-point") {
				commit();
			} else {
				setSketchTick((v) => v + 1);
				updateSources(); // Manuelles Update für die Sketch-Source
			}
		};

		const onMouseMove = (e: maplibregl.MapMouseEvent) => {
			if (
				mode === "select" ||
				mode === "draw-point" ||
				sketchRef.current.length === 0
			)
				return;
			hoverRef.current = [e.lngLat.lng, e.lngLat.lat];
			setSketchTick((v) => v + 1);
			updateSources(); // Manuelles Update für die Sketch-Source
		};

		const onDblClick = (e: maplibregl.MapMouseEvent) => {
			if (mode === "select") return;
			e.preventDefault();
			commit();
		};

		map.on("click", onClick);
		map.on("mousemove", onMouseMove);
		map.on("dblclick", onDblClick);
		map.getCanvas().style.cursor = mode === "select" ? "" : "crosshair";

		return () => {
			map.off("click", onClick);
			map.off("mousemove", onMouseMove);
			map.off("dblclick", onDblClick);
		};
	}, [map, mode, commit, updateSources]);

	/** --- Selectors --- */

	const allFeatures = useMemo(() => {
		return [...features].sort(
			(a, b) => (b.properties?.timestamp ?? 0) - (a.properties?.timestamp ?? 0),
		);
	}, [features]);

	const measurements = useMemo(
		() => allFeatures.filter((f) => f.properties?.usage === "measure"),
		[allFeatures],
	);

	const sketches = useMemo(
		() => allFeatures.filter((f) => f.properties?.usage === "draw"),
		[allFeatures],
	);

	const currentSketch = useMemo(() => {
		// sketchTick wird hier aktiv genutzt, um Biome zufriedenzustellen
		return sketchTick >= 0
			? buildCurrentSketchFeature({
					mode,
					coords: sketchRef.current,
					hover: hoverRef.current,
				})
			: null;
	}, [sketchTick, mode]);

	/** --- Public API --- */

	return {
		mode,
		setMode: (m: DrawMode) => {
			sketchRef.current = [];
			hoverRef.current = null;
			setMode(m);
			setSketchTick((v) => v + 1);
			updateSources();
		},

		allFeatures,
		measurements,
		sketches,
		currentSketch,
		hasSketch: sketchRef.current.length > 0,
		hasFeatures: features.length > 0,

		undoLast: () => {
			sketchRef.current.pop();
			setSketchTick((v) => v + 1);
			updateSources();
		},
		finish: commit,
		cancel: () => {
			sketchRef.current = [];
			hoverRef.current = null;
			setSketchTick((v) => v + 1);
			updateSources();
		},
		clearAll: () => {
			setFeatures([]);
			sketchRef.current = [];
			hoverRef.current = null;
			setSketchTick((v) => v + 1);
			setMode("select");
			// updateSources wird durch useEffect[features] getriggert
		},
		deleteFeature: (id: string) => {
			setFeatures((prev) => prev.filter((f) => f.properties?.id !== id));
		},
	};
}
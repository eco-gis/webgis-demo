"use client";

import maplibregl, {
	type LayerSpecification,
	type LngLatLike,
	type Map as MaplibreMap,
	type SourceSpecification,
} from "maplibre-gl";
import * as pmtiles from "pmtiles";
import { type MutableRefObject, type RefObject, useEffect, useRef, useState } from "react";
import { mapTilerStyleUrl } from "@/app/lib/maptiler/styles";
import { reorderAppLayers } from "@/app/map/core/layer-order";

// ============================================================================
// Types
// ============================================================================

type UseMapLibreOptions = {
	containerRef: RefObject<HTMLDivElement | null>;
	center: LngLatLike;
	zoom: number;
	onLoad?: (map: MaplibreMap) => void;
	/** 0..1 - applies opacity to basemap layers only */
	basemapOpacity?: number;
};

type OverlayStyle = {
	sources?: Record<string, SourceSpecification>;
	layers?: LayerSpecification[];
};

// ============================================================================
// Constants & Protocol
// ============================================================================

const APP_LAYER_PREFIXES = ["waldkauz-", "wms-", "draw-", "search-marker"] as const;

let pmtilesRegistered = false;
function ensurePmtilesProtocolRegistered(): void {
	if (pmtilesRegistered) return;
	const protocol = new pmtiles.Protocol();
	maplibregl.addProtocol("pmtiles", protocol.tile);
	pmtilesRegistered = true;
}

// ============================================================================
// Helper Functions
// ============================================================================

function isAppLayer(layerId: string): boolean {
	return APP_LAYER_PREFIXES.some((prefix) => layerId.startsWith(prefix));
}

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

async function loadOverlayStyle(): Promise<OverlayStyle> {
	const res = await fetch("/data/style.json", { cache: "no-store" });
	if (!res.ok) throw new Error("Failed to load style.json");
	const json: unknown = await res.json();

	// minimal safe-ish parsing
	if (typeof json !== "object" || json === null) return { sources: {}, layers: [] };
	const obj = json as { sources?: unknown; layers?: unknown };

	return {
		sources: (obj.sources ?? {}) as Record<string, SourceSpecification>,
		layers: (obj.layers ?? []) as LayerSpecification[],
	};
}

function applyOverlays(map: MaplibreMap, overlays: OverlayStyle): void {
	const { sources = {}, layers = [] } = overlays;

	for (const [id, spec] of Object.entries(sources)) {
		if (!map.getSource(id)) map.addSource(id, spec);
	}

	for (const layer of layers) {
		if (!map.getLayer(layer.id)) {
			try {
				map.addLayer({
					...layer,
					metadata: { ...(layer.metadata ?? {}), geoRole: "overlay" },
				} as LayerSpecification);
			} catch (err) {
				console.error(`❌ Failed to add layer ${layer.id}:`, err);
			}
		}
	}
}

function setupMapControls(map: MaplibreMap): void {
	map.dragPan.enable({ linearity: 0.3 });
	map.scrollZoom.enable();
	map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
	map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
}

function applyBasemapOpacity(map: MaplibreMap, overlays: OverlayStyle, opacity: number): void {
	const o = clamp01(opacity);
	const overlayLayerIds = new Set((overlays.layers ?? []).map((l) => l.id));
	const layers = map.getStyle()?.layers;
	if (!layers) return;

	for (const layer of layers) {
		const meta = (layer as { metadata?: unknown }).metadata as { geoRole?: unknown } | undefined;
		const isOverlay = meta?.geoRole === "overlay";

		if (isOverlay || overlayLayerIds.has(layer.id) || isAppLayer(layer.id)) continue;

		const id = layer.id;

		if (layer.type === "symbol") {
			map.setPaintProperty(id, "icon-opacity", o);
			map.setPaintProperty(id, "text-opacity", o);
			continue;
		}

		const propByType: Partial<Record<(typeof layer)["type"], string>> = {
			fill: "fill-opacity",
			line: "line-opacity",
			circle: "circle-opacity",
			raster: "raster-opacity",
			background: "background-opacity",
		};

		const prop = propByType[layer.type];
		if (prop) map.setPaintProperty(id, prop, o);
	}
}

// ============================================================================
// Event Setup
// ============================================================================

function setupMapEvents(
	map: MaplibreMap,
	overlaysRef: MutableRefObject<OverlayStyle | null>,
	opacityRef: MutableRefObject<number>,
	onLoadRef: MutableRefObject<UseMapLibreOptions["onLoad"]>,
): () => void {
	const restoreLayers = () => {
		const overlays = overlaysRef.current;
		if (!overlays) return;

		applyOverlays(map, overlays);
		map.fire("app.style.restore_dynamic");
		reorderAppLayers(map);
		applyBasemapOpacity(map, overlays, opacityRef.current);
		map.fire("app.style.ready");
	};

	map.once("load", () => {
		restoreLayers();
		onLoadRef.current?.(map);
	});

	map.on("basemap.ready", restoreLayers);

	return () => {
		map.off("basemap.ready", restoreLayers);
	};
}

// ============================================================================
// Hook
// ============================================================================

export function useMapLibre({ containerRef, center, zoom, onLoad, basemapOpacity = 1 }: UseMapLibreOptions) {
	const mapRef = useRef<MaplibreMap | null>(null);
	const overlaysRef = useRef<OverlayStyle | null>(null);
	const [map, setMap] = useState<MaplibreMap | null>(null);

	const opacityRef = useRef(basemapOpacity);
	useEffect(() => {
		opacityRef.current = basemapOpacity;
	}, [basemapOpacity]);

	const onLoadRef = useRef<UseMapLibreOptions["onLoad"]>(onLoad);
	useEffect(() => {
		onLoadRef.current = onLoad;
	}, [onLoad]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || mapRef.current) return;

		let cancelled = false;

		ensurePmtilesProtocolRegistered();

		(async () => {
			const overlays = await loadOverlayStyle();
			if (cancelled) return;

			overlaysRef.current = overlays;

			const m = new maplibregl.Map({
				container,
				style: mapTilerStyleUrl("ch-swisstopo-lbm"),
				center,
				zoom,
				maxZoom: 22,
			});

			setupMapControls(m);

			const cleanupEvents = setupMapEvents(m, overlaysRef, opacityRef, onLoadRef);

			mapRef.current = m;
			setMap(m);

			// ensure cleanup removes listeners too
			const origRemove = m.remove.bind(m);
			m.remove = () => {
				cleanupEvents();
				origRemove();
				return m;
			};
		})();

		return () => {
			cancelled = true;
			if (mapRef.current) mapRef.current.remove();
			mapRef.current = null;
			setMap(null);
		};
		// bewusst nur einmal initialisieren:
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [center, containerRef.current, zoom]);

	useEffect(() => {
		if (map && overlaysRef.current) {
			applyBasemapOpacity(map, overlaysRef.current, basemapOpacity);
		}
	}, [map, basemapOpacity]);

	return { map };
}

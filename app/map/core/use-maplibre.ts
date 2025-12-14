// app/map/core/use-maplibre.ts
"use client";

import { mapTilerStyleUrl } from "@/app/lib/maptiler/styles";
import maplibregl, {
	type LayerSpecification,
	type LngLatLike,
	type Map as MaplibreMap,
	type SourceSpecification,
} from "maplibre-gl";
import * as pmtiles from "pmtiles";
import { useEffect, useRef, useState } from "react";

type UseMapLibreOptions = {
	containerRef: React.RefObject<HTMLDivElement | null>;
	center: LngLatLike;
	zoom: number;
	onLoad?: (map: MaplibreMap) => void;
};

let pmtilesRegistered = false;

function ensurePmtilesProtocolRegistered(): void {
	if (pmtilesRegistered) return;

	const protocol = new pmtiles.Protocol();
	maplibregl.addProtocol("pmtiles", protocol.tile);

	pmtilesRegistered = true;
}

type OverlayStyle = {
	sources?: Record<string, SourceSpecification>;
	layers?: LayerSpecification[];
};

async function loadOverlayStyle(): Promise<OverlayStyle> {
	const res = await fetch("/data/style.json", { cache: "no-store" });
	if (!res.ok) {
		throw new Error(`Failed to load /data/style.json (HTTP ${res.status})`);
	}
	return (await res.json()) as OverlayStyle;
}

function findFirstSymbolLayerId(map: MaplibreMap): string | undefined {
	const style = map.getStyle();
	const layers = style?.layers ?? [];
	const firstSymbol = layers.find((l) => l.type === "symbol");
	return firstSymbol?.id;
}

function applyOverlays(map: MaplibreMap, overlays: OverlayStyle): void {
	const sources = overlays.sources ?? {};
	for (const [id, spec] of Object.entries(sources)) {
		if (!map.getSource(id)) map.addSource(id, spec);
	}

	const beforeId = findFirstSymbolLayerId(map);

	const layers = overlays.layers ?? [];
	for (const layer of layers) {
		if (map.getLayer(layer.id)) continue;
		if (beforeId) map.addLayer(layer, beforeId);
		else map.addLayer(layer);
	}
}

export function useMapLibre({
	containerRef,
	center,
	zoom,
	onLoad,
}: UseMapLibreOptions): { map: MaplibreMap | null } {
	const mapRef = useRef<MaplibreMap | null>(null);
	const [map, setMap] = useState<MaplibreMap | null>(null);

	const onLoadRef = useRef<UseMapLibreOptions["onLoad"]>(undefined);
	onLoadRef.current = onLoad;

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		if (mapRef.current) return;

		ensurePmtilesProtocolRegistered();

		const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
		if (!key) {
			console.error("Missing NEXT_PUBLIC_MAPTILER_KEY in environment.");
			return;
		}

		let cancelled = false;

		(async () => {
			const overlays = await loadOverlayStyle();
			if (cancelled) return;

			const baseStyleUrl = mapTilerStyleUrl("ch-swisstopo-lbm");

			const m = new maplibregl.Map({
				container,
				style: baseStyleUrl,
				center,
				zoom,
				maxZoom: 22,
			});

			m.dragPan.enable({ linearity: 0.3 });
			m.scrollZoom.enable();
			m.doubleClickZoom.enable();
			m.keyboard.enable();
			m.touchZoomRotate.enable({ around: "center" });
			m.touchPitch.enable();

			if (process.env.NODE_ENV === "development") {
				(window as unknown as { __MAP__?: MaplibreMap }).__MAP__ = m;
			}

			m.addControl(
				new maplibregl.NavigationControl({ visualizePitch: true }),
				"top-right",
			);
			m.addControl(
				new maplibregl.ScaleControl({ unit: "metric" }),
				"bottom-left",
			);

			m.on("load", () => {
				// initial overlays einmal anwenden
				applyOverlays(m, overlays);
				onLoadRef.current?.(m);
			});

			mapRef.current = m;
			setMap(m);
		})().catch((err: unknown) => {
			console.error("Map init failed:", err);
		});

		return () => {
			cancelled = true;
			mapRef.current?.remove();
			mapRef.current = null;
			setMap(null);
		};
	}, [containerRef, center, zoom]);

	return { map };
}

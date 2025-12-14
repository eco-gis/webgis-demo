// ./app/components/shell/map-container.tsx
"use client";

import type { LngLatLike, Map as MaplibreMap } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/app/components/shell/app-shell";
import { BasemapControl } from "@/app/map/basemaps/basemap-control";
import { useBasemapStore } from "@/app/map/basemaps/basemap-store";
import { useBasemapSync } from "@/app/map/basemaps/use-basemap-sync";
import { MAP_CONFIG } from "@/app/map/config/map-config";
import { moveCustomLayersToTopOrdered } from "@/app/map/core/layer-order";
import { useMapLibre } from "@/app/map/core/use-maplibre";
import { PopupOverlay } from "@/app/map/features/popup/popup-overlay";
import { useMapPopup } from "@/app/map/features/popup/use-map-popup";
import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";
import { useTocSync } from "@/app/map/features/toc/use-toc-sync";
import { registerOverlays } from "@/app/map/layers/register-overlays";

function parseCenter(raw?: string): LngLatLike {
	if (!raw) return [8.55, 47.37];
	const parts = raw.split(",").map((v) => Number(v.trim()));
	return parts.length === 2 && parts.every(Number.isFinite)
		? [parts[0], parts[1]]
		: [8.55, 47.37];
}

function parseZoom(raw?: string): number {
	const z = raw ? Number(raw) : 11;
	return Number.isFinite(z) ? z : 11;
}

const CUSTOM_LAYER_PREFIXES = ["dummy-", "draw-", "search-marker"] as const;

function applyAppLayers(map: MaplibreMap): void {
	registerOverlays(map, MAP_CONFIG.overlays);
	ensureSearchMarkerLayer(map);
}

export function MapContainer() {
	const containerRef = useRef<HTMLDivElement | null>(null);

	const center = useMemo(
		() => parseCenter(process.env.NEXT_PUBLIC_MAP_CENTER),
		[],
	);
	const zoom = useMemo(() => parseZoom(process.env.NEXT_PUBLIC_MAP_ZOOM), []);

	const { basemapId, setBasemapId } = useBasemapStore();

	// controlled opacity for UI + map
	const [basemapOpacity, setBasemapOpacity] = useState<number>(1);

	const { map } = useMapLibre({
		containerRef,
		center,
		zoom,
		basemapOpacity,
		onLoad: (m) => {
			applyAppLayers(m);

			// Ganz am Schluss (nach möglichen weiteren Layer-Adds)
			requestAnimationFrame(() => {
				moveCustomLayersToTopOrdered(m, CUSTOM_LAYER_PREFIXES);
			});
		},
	});

	// ✅ erst nachdem map existiert
	useBasemapSync(map, basemapId);

	// nach jedem setStyle() (Basemap-Wechsel) kommen die custom Layer zurück
	useEffect(() => {
		if (!map) return;

		const onStyleLoad = () => {
			applyAppLayers(map);

			// WICHTIG: nach allen anderen style.load Listenern (Drawing etc.)
			requestAnimationFrame(() => {
				moveCustomLayersToTopOrdered(map, CUSTOM_LAYER_PREFIXES);
			});
		};

		map.on("style.load", onStyleLoad);
		return () => {
			map.off("style.load", onStyleLoad);
		};
	}, [map]);

	useTocSync(map, MAP_CONFIG.tocItems);

	const { popup, close } = useMapPopup(map, {
		interactiveLayerIds: ["dummy-polygons", "dummy-lines", "dummy-points"],
		tolerancePx: 0,
	});

	return (
		<AppShell map={map}>
			<div className="relative h-full w-full">
				<div ref={containerRef} className="h-full w-full" />

				{popup.open && (
					<PopupOverlay
						map={map}
						popup={popup}
						onClose={close}
						tocItems={MAP_CONFIG.tocItems}
					/>
				)}

				<BasemapControl
					value={basemapId}
					onChange={setBasemapId}
					opacity={basemapOpacity}
					onOpacityChange={setBasemapOpacity}
				/>
			</div>
		</AppShell>
	);
}

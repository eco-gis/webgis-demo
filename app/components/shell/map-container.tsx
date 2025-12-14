"use client";

import { AppShell } from "@/app/components/shell/app-shell";
import { useMapLibre } from "@/app/map/core/use-maplibre";
import { PopupOverlay } from "@/app/map/features/popup/popup-overlay";
import { useMapPopup } from "@/app/map/features/popup/use-map-popup";
import { ensureSearchMarkerLayer } from "@/app/map/features/search/search-marker";
import { useTocSync } from "@/app/map/features/toc/use-toc-sync";
import { registerOverlays } from "@/app/map/layers/register-overlays";
import { MAP_CONFIG } from "@/app/map/map-config";
import type { LngLatLike } from "maplibre-gl";
import { useMemo, useRef } from "react";

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

export function MapContainer() {
	const containerRef = useRef<HTMLDivElement | null>(null);

	const center = useMemo(
		() => parseCenter(process.env.NEXT_PUBLIC_MAP_CENTER),
		[],
	);
	const zoom = useMemo(() => parseZoom(process.env.NEXT_PUBLIC_MAP_ZOOM), []);

	const { map } = useMapLibre({
		containerRef,
		center,
		zoom,
		onLoad: (m) => {
			registerOverlays(m, MAP_CONFIG.overlays);
			ensureSearchMarkerLayer(m);
		},
	});
	useTocSync(map, MAP_CONFIG.tocItems);

	const { popup, close } = useMapPopup({
		map,
		layerIds: [...MAP_CONFIG.interactiveLayerIds],
	});
	return (
		<AppShell map={map}>
			<div className="relative h-full w-full">
				<div ref={containerRef} className="h-full w-full" />
				{popup && <PopupOverlay popup={popup} onClose={close} />}
			</div>
		</AppShell>
	);
}

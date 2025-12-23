// ./app/components/shell/map-container.tsx
"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/app/components/shell/app-shell";
import { BasemapControl } from "@/app/map/basemaps/basemap-control";
import { useBasemapStore } from "@/app/map/basemaps/basemap-store";
import { useBasemapSync } from "@/app/map/basemaps/use-basemap-sync";
import { MAP_CONFIG } from "@/app/map/config/map-config";
import { useMapSetup } from "@/app/map/core/use-map-setup";
import { useMapLibre } from "@/app/map/core/use-maplibre";
import { DrawingToolbar } from "@/app/map/features/drawing/drawing-toolbar";
import { useDrawing } from "@/app/map/features/drawing/use-drawing";
import { PopupOverlay } from "@/app/map/features/popup/popup-overlay";
import { useMapPopup } from "@/app/map/features/popup/use-map-popup";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import { useTocSync } from "@/app/map/features/toc/use-toc-sync";
import { useWmsFromUrl } from "@/app/map/features/wms/use-wms-from-url";

const DEFAULT_CENTER: [number, number] = [8.55, 47.37];
const DEFAULT_ZOOM = 11;

function parseCenter(raw?: string): [number, number] {
	if (!raw) return DEFAULT_CENTER;

	const parts = raw
		.split(",")
		.map((p) => Number(p.trim()))
		.filter((n) => Number.isFinite(n));

	return parts.length === 2 ? [parts[0], parts[1]] : DEFAULT_CENTER;
}

function readZoom(raw?: string): number {
	const z = Number(raw);
	return Number.isFinite(z) ? z : DEFAULT_ZOOM;
}

function setCssVarPx(host: HTMLElement, name: string, px: number): void {
	host.style.setProperty(name, `${Math.max(0, Math.round(px))}px`);
}

/**
 * Reserviert "No-fly zones" für das Popup, damit es Controls nicht überdeckt.
 * Setzt CSS-Variablen auf dem Host:
 *  - --popup-safe-right
 *  - --popup-safe-top
 */
function usePopupSafeInsets(opts: {
	hostRef: RefObject<HTMLDivElement | null>;
	rightControlsRef: RefObject<HTMLDivElement | null>;
	topControlsRef?: RefObject<HTMLDivElement | null>;
	map?: MapLibreMap | null;
}): void {
	const { hostRef, rightControlsRef, topControlsRef, map } = opts;

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		const compute = () => {
			const hostRect = host.getBoundingClientRect();

			const rightRect = rightControlsRef.current?.getBoundingClientRect() ?? null;
			const safeRight = rightRect ? Math.max(0, hostRect.right - rightRect.left) + 16 : 0;
			setCssVarPx(host, "--popup-safe-right", safeRight);

			const topRect = topControlsRef?.current?.getBoundingClientRect() ?? null;
			const safeTop = topRect ? Math.max(0, topRect.bottom - hostRect.top) + 12 : 0;
			setCssVarPx(host, "--popup-safe-top", safeTop);
		};

		compute();

		const ro = new ResizeObserver(() => compute());
		ro.observe(host);

		const rightEl = rightControlsRef.current;
		if (rightEl) ro.observe(rightEl);

		const topEl = topControlsRef?.current ?? null;
		if (topEl) ro.observe(topEl);

		window.addEventListener("resize", compute);

		// Map resize (Canvas/Layout)
		const onMapResize = () => compute();
		if (map) map.on("resize", onMapResize);

		return () => {
			window.removeEventListener("resize", compute);
			ro.disconnect();
			if (map) map.off("resize", onMapResize);
		};
	}, [hostRef, rightControlsRef, topControlsRef, map]);
}

export function MapContainer() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const hostRef = useRef<HTMLDivElement | null>(null);

	// Control-Refs für Popup-SafeInsets
	const rightControlsRef = useRef<HTMLDivElement | null>(null);
	// const topControlsRef = useRef<HTMLDivElement | null>(null);

	// Stores/State
	const { basemapId, setBasemapId, isHydrated } = useBasemapStore();
	const dynamicItems = useTocStore((s) => s.dynamicItems);
	const [basemapOpacity, setBasemapOpacity] = useState<number>(1);

	const onBasemapChange = (next: typeof basemapId) => {
		setBasemapId(next);
	};

	// Konfig aus ENV (einmalig)
	const center = useMemo(() => parseCenter(process.env.NEXT_PUBLIC_MAP_CENTER), []);
	const zoom = useMemo(() => readZoom(process.env.NEXT_PUBLIC_MAP_ZOOM), []);

	const tocItems = useMemo(() => {
		if (dynamicItems.length === 0) return MAP_CONFIG.tocItems;
		return [...MAP_CONFIG.tocItems, ...dynamicItems];
	}, [dynamicItems]);

	// Map
	const { map } = useMapLibre({
		containerRef,
		center,
		zoom,
		basemapOpacity,
	});

	// Setup/Sync
	useMapSetup(map);
	useBasemapSync(map, basemapId, { enabled: isHydrated });
	useWmsFromUrl(map);
	useTocSync(map, tocItems);

	// Features
	const drawing = useDrawing(map);
	const { popup, close } = useMapPopup(map, {
		interactiveLayerIds: [...MAP_CONFIG.interactiveLayerIds],
	});

	// Popup soll Controls nicht überdecken (Desktop)
	usePopupSafeInsets({
		hostRef,
		rightControlsRef,
		map,
		// topControlsRef,
	});

	// optional: falls Hydration später kommt, Opacity initialisieren/normalisieren
	useEffect(() => {
		if (!isHydrated) return;
		setBasemapOpacity((v) => (Number.isFinite(v) ? v : 1));
	}, [isHydrated]);

	return (
		<AppShell map={map} drawing={drawing}>
			<div ref={hostRef} className="relative h-full w-full overflow-hidden bg-slate-50">
				<div ref={containerRef} className="h-full w-full" />

				{/* Map Controls Layer */}
				<div className="pointer-events-none absolute inset-0 z-10 p-4">
					{drawing.mode !== "select" && (
						<div className="pointer-events-auto absolute left-4 top-20 animate-in fade-in slide-in-from-left-4">
							<DrawingToolbar drawing={drawing} />
						</div>
					)}

					<div
						ref={rightControlsRef}
						className="pointer-events-auto absolute bottom-4 right-4 flex flex-col items-end gap-2">
						<BasemapControl
							value={basemapId}
							onChange={onBasemapChange}
							opacity={basemapOpacity}
							onOpacityChange={setBasemapOpacity}
						/>
					</div>
				</div>

				{/* Popup */}
				{popup.open && <PopupOverlay popup={popup} onClose={close} tocItems={tocItems} />}
			</div>
		</AppShell>
	);
}

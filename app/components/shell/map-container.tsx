// ./app/components/shell/map-container.tsx
"use client";

import type { Map as MapLibreMap } from "maplibre-gl";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "@/app/components/shell/app-shell";
import { APP_CONFIG } from "@/app/config/app-config";

import { BasemapControl } from "@/app/map/basemaps/basemap-control";
import { useBasemapStore } from "@/app/map/basemaps/basemap-store";
import { useBasemapSync } from "@/app/map/basemaps/use-basemap-sync";

import { MAP_CONFIG } from "@/app/map/config/map-config";
import { readViewFromUrl, type UrlView } from "@/app/map/core/url-view";
import { useMapSetup } from "@/app/map/core/use-map-setup";
import { useMapLibre } from "@/app/map/core/use-maplibre";
import { useUrlViewSync } from "@/app/map/core/use-url-view-sync";

import { CoordsMenu } from "@/app/map/features/coords/coords-menu";
import { useRightClickCoordinates } from "@/app/map/features/coords/use-right-click-coordinates";

import { DrawingToolbar } from "@/app/map/features/drawing/drawing-toolbar";
import { useDrawing } from "@/app/map/features/drawing/use-drawing";

import { PopupOverlay } from "@/app/map/features/popup/popup-overlay";
import { useMapPopup } from "@/app/map/features/popup/use-map-popup";

import { useTocStore } from "@/app/map/features/toc/toc-store";
import { useTocSync } from "@/app/map/features/toc/use-toc-sync";

import { useWmsFromUrl } from "@/app/map/features/wms/use-wms-from-url";

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_CENTER: [number, number] = [8.64, 47.695];
const DEFAULT_ZOOM = 11;

// ============================================================================
// Env parsing helpers (pure)
// ============================================================================

function parseCenter(raw?: string): [number, number] {
	if (!raw) return DEFAULT_CENTER;

	const parts = raw
		.split(",")
		.map((p) => Number(p.trim()))
		.filter((n) => Number.isFinite(n));

	return parts.length === 2 ? [parts[0], parts[1]] : DEFAULT_CENTER;
}

function parseZoom(raw?: string): number {
	const z = Number(raw);
	return Number.isFinite(z) ? z : DEFAULT_ZOOM;
}

function setCssVarPx(host: HTMLElement, name: string, px: number): void {
	host.style.setProperty(name, `${Math.max(0, Math.round(px))}px`);
}

// ============================================================================
// Popup safe insets
// ============================================================================

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

		const ro = new ResizeObserver(compute);
		ro.observe(host);

		const rightEl = rightControlsRef.current;
		if (rightEl) ro.observe(rightEl);

		const topEl = topControlsRef?.current ?? null;
		if (topEl) ro.observe(topEl);

		window.addEventListener("resize", compute);

		const onMapResize = () => compute();
		if (map) map.on("resize", onMapResize);

		return () => {
			window.removeEventListener("resize", compute);
			ro.disconnect();
			if (map) map.off("resize", onMapResize);
		};
	}, [hostRef, rightControlsRef, topControlsRef, map]);
}

// ============================================================================
// Component
// ============================================================================

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

	// URL view (client-only, SSR-safe)
	const [urlView, setUrlView] = useState<UrlView | null>(null);
	useEffect(() => {
		setUrlView(readViewFromUrl(window.location.search));
	}, []);

	// Env defaults (stable)
	const envCenter = useMemo(() => parseCenter(APP_CONFIG.map.center), []);
	const envZoom = useMemo(() => parseZoom(APP_CONFIG.map.zoom), []);

	// Initial view for map creation (URL overrides env)
	const initialCenter = useMemo<[number, number]>(() => {
		if (!urlView) return envCenter;
		return [urlView.lon, urlView.lat];
	}, [envCenter, urlView]);

	const initialZoom = useMemo<number>(() => {
		if (!urlView) return envZoom;
		return urlView.zoom;
	}, [envZoom, urlView]);

	const tocItems = useMemo(() => {
		return dynamicItems.length === 0 ? MAP_CONFIG.tocItems : [...MAP_CONFIG.tocItems, ...dynamicItems];
	}, [dynamicItems]);

	const onBasemapChange = useCallback(
		(next: typeof basemapId) => {
			setBasemapId(next);
		},
		[setBasemapId],
	);

	// Map
	const { map } = useMapLibre({
		containerRef,
		center: initialCenter,
		zoom: initialZoom,
		basemapOpacity,
	});

	// Setup/Sync
	useMapSetup(map);
	useBasemapSync(map, basemapId, { enabled: isHydrated });
	useWmsFromUrl(map);
	useTocSync(map, tocItems);

	// URL sync: initial apply is already handled by initialCenter/initialZoom
	useUrlViewSync(map, { applyOnLoad: false, updateUrl: true, includeOrientation: true });

	// Features
	const coords = useRightClickCoordinates(map);
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

	// Basemap opacity normalization after hydration
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
						className="pointer-events-auto absolute bottom-12 right-4 flex flex-col items-end gap-2">
						<BasemapControl
							value={basemapId}
							onChange={onBasemapChange}
							opacity={basemapOpacity}
							onOpacityChange={setBasemapOpacity}
						/>
					</div>
				</div>

				{/* Right click coordinate menu */}
				<CoordsMenu state={coords.state} onClose={coords.close} />

				{/* Popup */}
				{popup.open && <PopupOverlay popup={popup} onClose={close} tocItems={tocItems} />}
			</div>
		</AppShell>
	);
}

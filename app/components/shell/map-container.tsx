"use client";

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
import { useMemo, useRef, useState } from "react";

// Helper außerhalb der Komponente für bessere Performance (keine Neu-Deklaration)
const parseCenter = (raw?: string): [number, number] => {
	if (!raw) return [8.55, 47.37];
	const parts = raw.split(",").map(Number);
	return parts.length === 2 ? [parts[0], parts[1]] : [8.55, 47.37];
};

// app/map/page.tsx oder MapContainer.tsx

export function MapContainer() {
	const containerRef = useRef<HTMLDivElement | null>(null);

	// State & Store
	const { basemapId, setBasemapId } = useBasemapStore();
	const [basemapOpacity, setBasemapOpacity] = useState<number>(1);
	const dynamicItems = useTocStore((s) => s.dynamicItems);

	// Konfiguration
	const center = useMemo(
		() => parseCenter(process.env.NEXT_PUBLIC_MAP_CENTER),
		[],
	);
	const zoom = useMemo(
		() => Number(process.env.NEXT_PUBLIC_MAP_ZOOM) || 11,
		[],
	);

	const mergedTocItems = useMemo(
		() => [...MAP_CONFIG.tocItems, ...dynamicItems],
		[dynamicItems],
	);

	// Map-Instanz (overlays werden nicht mehr benötigt)
	const { map } = useMapLibre({
		containerRef,
		center,
		zoom,
		basemapOpacity,
	});

	// ✅ Setup OHNE overlays Parameter
	useMapSetup(map);

	useBasemapSync(map, basemapId);
	useWmsFromUrl(map);
	useTocSync(map, mergedTocItems);

	const drawing = useDrawing(map);
	const { popup, close } = useMapPopup(map, {
		interactiveLayerIds: [...MAP_CONFIG.interactiveLayerIds],
	});

	return (
		<AppShell map={map} drawing={drawing}>
			<div className="relative h-full w-full overflow-hidden bg-slate-50">
				<div ref={containerRef} className="h-full w-full" />

				<div className="pointer-events-none absolute inset-0 z-10 p-4">
					{drawing.mode !== "select" && (
						<div className="pointer-events-auto absolute left-4 top-20 animate-in fade-in slide-in-from-left-4">
							<DrawingToolbar drawing={drawing} />
						</div>
					)}

					<div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col items-end gap-2">
						<BasemapControl
							value={basemapId}
							onChange={setBasemapId}
							opacity={basemapOpacity}
							onOpacityChange={setBasemapOpacity}
						/>
					</div>
				</div>

				{popup.open && (
					<PopupOverlay
						map={map}
						popup={popup}
						onClose={close}
						tocItems={mergedTocItems}
					/>
				)}
			</div>
		</AppShell>
	);
}

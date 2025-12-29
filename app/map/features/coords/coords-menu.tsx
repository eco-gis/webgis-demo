// app/map/features/coords/coords-menu.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import type { ClickCoordsState } from "./use-right-click-coordinates";

function fmtWgs84(lon: number, lat: number): string {
	return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

function fmtLv95(e: number, n: number): string {
	return `E ${Math.round(e)}, N ${Math.round(n)}`;
}

async function copyText(text: string): Promise<void> {
	await navigator.clipboard.writeText(text);
}

function buildShareUrl(lat: number, lon: number, view?: { zoom: number; bearing: number; pitch: number }): string {
	const origin = typeof window !== "undefined" ? window.location.origin : "https://demo-webgis.eco-gis.ch";
	const url = new URL("/", origin);

	url.searchParams.set("lat", lat.toFixed(6));
	url.searchParams.set("lon", lon.toFixed(6));

	if (view) {
		url.searchParams.set("z", view.zoom.toFixed(2));
		url.searchParams.set("b", view.bearing.toFixed(0));
		url.searchParams.set("p", view.pitch.toFixed(0));
	}

	return url.toString();
}

type Props = {
	state: ClickCoordsState;
	onClose: () => void;
};

export function CoordsMenu({ state, onClose }: Props) {
	if (state.kind !== "open") return null;

	const wgs = fmtWgs84(state.wgs84.lon, state.wgs84.lat);
	const lv = fmtLv95(state.lv95.e, state.lv95.n);

	const share = buildShareUrl(state.wgs84.lat, state.wgs84.lon, state.view);

	return (
		<div
			className="pointer-events-auto absolute z-20"
			style={{ left: state.screen.x + 10, top: state.screen.y + 10 }}
			role="dialog"
			aria-label="Koordinaten"
			tabIndex={-1}
			onContextMenu={(e) => e.preventDefault()}
			onKeyDown={(e) => {
				if (e.key === "Escape") onClose();
			}}>
			<Card className="w-70 p-3 shadow-md">
				<div className="space-y-3 text-sm">
					<div>
						<div className="text-muted-foreground">WGS84</div>
						<div className="font-mono">{wgs}</div>
					</div>
					<div>
						<div className="text-muted-foreground">LV95</div>
						<div className="font-mono">{lv}</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button size="sm" variant="secondary" onClick={() => void copyText(wgs)}>
							Copy WGS84
						</Button>
						<Button size="sm" variant="secondary" onClick={() => void copyText(lv)}>
							Copy LV95
						</Button>
						<Button size="sm" variant="outline" onClick={() => void copyText(share)}>
							Copy Share-Link
						</Button>
						<Button size="sm" variant="ghost" onClick={onClose}>
							Schliessen
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}

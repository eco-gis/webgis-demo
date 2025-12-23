// app/map/popups/waldkauz/waldkauz-point-popup.tsx
"use client";

import type * as maplibregl from "maplibre-gl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { AudioPlayer } from "./waldkauz/audio-player";
import { PresenceChart, usePresenceFiles } from "./waldkauz/presence-chart";
import { getStringProp } from "./waldkauz/types";

export function WaldkauzPointPopup({ feature }: { feature: maplibregl.MapGeoJSONFeature }) {
	const location = getStringProp(feature, "location") ?? "Unbekannt";
	const locationId = getStringProp(feature, "location_id");

	const presenceFiles = usePresenceFiles(locationId);

	return (
		<div className="flex w-full min-w-0 flex-col gap-2">
			<div className="min-w-0">
				<h3 className="truncate text-sm font-bold tracking-tight text-foreground">{location}</h3>
				{locationId && (
					<div className="mt-0.5 truncate text-[10px] font-medium uppercase text-muted-foreground/80">{locationId}</div>
				)}
			</div>

			<div className="min-w-0">
				<AudioPlayer locationId={locationId} />
			</div>

			<div className="min-w-0 space-y-1.5">
				<div className="flex items-center justify-between gap-2">
					<h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aktivitätsanalyse</h4>
				</div>

				{presenceFiles ? (
					<Tabs defaultValue="sep" className="w-full">
						<TabsList className="grid h-7 w-full grid-cols-2 bg-muted/40 p-0.5">
							<TabsTrigger value="sep" className="text-[10px]">
								September 2024
							</TabsTrigger>
							<TabsTrigger value="feb" className="text-[10px]">
								Februar 2025
							</TabsTrigger>
						</TabsList>

						<TabsContent value="sep" className="mt-2 outline-none">
							<PresenceChart fileBase={presenceFiles.sep} />
						</TabsContent>
						<TabsContent value="feb" className="mt-2 outline-none">
							<PresenceChart fileBase={presenceFiles.feb} />
						</TabsContent>
					</Tabs>
				) : (
					<div className="rounded-lg border border-border/70 bg-muted/10 p-2 text-center text-[10px] text-muted-foreground">
						Keine Analysedaten vorhanden.
					</div>
				)}
			</div>
		</div>
	);
}

"use client";

import { Separator } from "@/app/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/map/features/sidebar/map-sidebar";
import type { Map as MaplibreMap } from "maplibre-gl";

export function AppShell({
	children,
	map,
}: {
	children: React.ReactNode;
	map: MaplibreMap | null;
}) {
	return (
		<SidebarProvider>
			<AppSidebar map={map} />
			<SidebarInset className="flex h-dvh flex-col">
				<header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="-ml-1" />
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<div className="text-sm font-medium">Mini WebGIS</div>
					</div>
				</header>
				<div className="min-h-0 flex-1">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

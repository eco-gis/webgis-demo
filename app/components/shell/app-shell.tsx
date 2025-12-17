"use client";

import { AppHeader } from "@/app/components/shell/app-header";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/app/components/ui/sidebar";
import type { useDrawing } from "@/app/map/features/drawing/use-drawing";
import { AppSidebar } from "@/app/map/features/sidebar/map-sidebar";
import type { Map as MaplibreMap } from "maplibre-gl";
import type { ReactNode } from "react";

interface AppShellProps {
	children: ReactNode;
	map: MaplibreMap | null;
	drawing: ReturnType<typeof useDrawing>;
}

export function AppShell({ children, map, drawing }: AppShellProps) {
	return (
		<SidebarProvider>
			<AppSidebar map={map} drawing={drawing} />

			<SidebarInset className="flex flex-col h-dvh w-full overflow-hidden relative">
				<AppHeader map={map} />

				{/* Trigger Positionierung */}
				<div className="absolute left-4 top-20 z-40 md:hidden pointer-events-none">
					<SidebarTrigger className="h-12 w-12 pointer-events-auto rounded-2xl bg-background shadow-xl border-2 border-primary/20 text-primary" />
				</div>

				<main className="flex-1 relative overflow-hidden">{children}</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

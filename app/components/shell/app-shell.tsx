"use client";

import { AppHeader } from "@/app/components/shell/app-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
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
		<SidebarProvider defaultOpen={true}>
			<AppSidebar map={map} drawing={drawing} />
			<SidebarInset className="flex flex-col h-dvh w-full overflow-hidden relative bg-background">
				<AppHeader map={map} />
				<main className="flex-1 relative overflow-hidden focus-visible:outline-none">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

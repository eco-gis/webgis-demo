// app/components/shell/app-shell.tsx
"use client";

import { AppHeader } from "@/app/components/shell/app-header";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { AppSidebar } from "@/app/map/features/sidebar/map-sidebar";
import type { Map as MaplibreMap } from "maplibre-gl";
import type { ReactNode } from "react";

export function AppShell({
		children,
		map,
	}: {
		children: ReactNode;
		map: MaplibreMap | null;
	}) {
		return (
			<SidebarProvider
				style={
					{
						"--sidebar-width": "360px",
						"--sidebar-width-mobile": "320px",
					} as React.CSSProperties
				}
			>
				<AppSidebar map={map} />

				<SidebarInset className="flex h-dvh flex-col">
					<AppHeader map={map} />

					{/* WICHTIG: min-h-0, sonst kann flex-child overflow/height kaputt machen */}
					<div className="min-h-0 flex-1">{children}</div>
				</SidebarInset>
			</SidebarProvider>
		);
	}

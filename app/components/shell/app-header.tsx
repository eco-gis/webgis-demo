"use client";

import { Menu } from "lucide-react";
import type { Map as MaplibreMap } from "maplibre-gl";

import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { cn } from "@/app/lib/utils";
import { SearchHeader } from "@/app/map/features/search/search-header";

export function AppHeader({
	map,
	className,
}: {
	map: MaplibreMap | null;
	className?: string;
}) {
	return (
		<header
			className={cn(
				"flex h-12 items-center justify-between gap-3 border-b border-border bg-background/80 px-3 backdrop-blur",
				className,
			)}
		>
			<div className="flex items-center gap-2">
				<SidebarTrigger
					className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
					aria-label="Sidebar öffnen"
				>
					<Menu className="h-5 w-5" />
				</SidebarTrigger>

				<div className="text-sm font-medium">Mini WebGIS</div>
			</div>

			<div className="flex items-center gap-2">
				<SearchHeader map={map} />
			</div>
		</header>
	);
}

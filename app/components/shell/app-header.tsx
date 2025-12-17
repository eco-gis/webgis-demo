"use client";

import { SidebarTrigger } from "@/app/components/ui/sidebar"; // Import hinzufügen
import { cn } from "@/app/lib/utils";
import { SearchHeader } from "@/app/map/features/search/search-header";
import type { Map as MaplibreMap } from "maplibre-gl";

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
					"sticky top-0 z-30 flex h-14 w-full items-center gap-2 md:gap-4 border-b border-border/40 bg-background/80 px-3 md:px-4 backdrop-blur-md transition-all self-stretch",
					className,
				)}
			>
				{/* Sidebar Toggle für Desktop & Mobile */}
				<SidebarTrigger className="-ml-1" />

				<div className="flex shrink-0 items-center gap-2 md:gap-3">
					<div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />
					<div className="flex flex-col gap-0 select-none overflow-hidden">
						<span className="text-[11px] md:text-xs font-bold leading-none tracking-tight text-foreground/90 uppercase truncate">
							Steinkauz Monitoring
						</span>
						<span className="text-[9px] md:text-[10px] text-muted-foreground font-medium whitespace-nowrap hidden xs:block">
							Schaffhausen
						</span>
					</div>
				</div>

				<div className="flex-1 min-w-2.5" />

				<div className="flex shrink items-center justify-end max-w-50 md:max-w-none">
					<SearchHeader map={map} />
				</div>
			</header>
		);
	}

"use client";

import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { cn } from "@/app/lib/utils";
import { SearchHeader } from "@/app/map/features/search/search-header";
import type { Map as MaplibreMap } from "maplibre-gl";

export function AppHeader({ map, className }: { map: MaplibreMap | null; className?: string }) {
	return (
		<header
			className={cn(
				"sticky top-0 z-30 flex h-14 w-full items-center gap-3 border-b border-border/40 bg-background/80 px-4 backdrop-blur-md transition-all self-stretch",
				className,
			)}>
			{/* Linker Bereich: Trigger und Titel */}
			<div className="flex min-w-0 items-center gap-3">
				<SidebarTrigger className="-ml-1 flex-shrink-0" />

				<div className="h-4 w-px bg-border/60 mx-1 hidden xs:block" />

				<div className="flex flex-col gap-0 select-none overflow-hidden">
					<span className="text-xs font-bold leading-none tracking-tight text-foreground/90 uppercase truncate">
						Akustisches Monitoring Waldkauz
					</span>
					<span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">Schaffhausen</span>
				</div>
			</div>

			{/* Spacer: Drückt die Suche nach rechts */}
			<div className="flex-1" />

			{/* Suchfeld: Nur ab Medium (Tablet/Desktop) sichtbar */}
			<div className="hidden md:flex shrink-0 items-center justify-end">
				<SearchHeader map={map} />
			</div>
		</header>
	);
}
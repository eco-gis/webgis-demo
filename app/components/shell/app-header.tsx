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
					"sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border/40 bg-background/70 px-4 backdrop-blur-md transition-all",
					className,
				)}
			>
				{/* LINKER BEREICH: Branding & Trigger */}
				<div className="flex shrink-0 items-center gap-3">
					<SidebarTrigger
						className="group h-9 w-9 border border-transparent hover:border-border/50 hover:bg-background/80 hover:shadow-sm transition-all"
						aria-label="Menü umschalten"
					>
						<Menu className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
					</SidebarTrigger>

					<div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

					<div className="flex flex-col gap-0 select-none">
						<span className="text-xs font-bold leading-none tracking-tight text-foreground/90 uppercase">
							Steinkauz Monitoring
						</span>
						<span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
							im Kanton Schaffhausen
						</span>
					</div>
				</div>

				{/* MITTLERER BEREICH: Spacer (Drückt die Suche nach rechts) */}
				<div className="flex-1" />

				{/* RECHTER BEREICH: Suche */}
				<div className="flex shrink-0 items-center justify-end">
					<div className="transition-all focus-within:w-96">
						<SearchHeader map={map} />
					</div>
				</div>
			</header>
		);
	}
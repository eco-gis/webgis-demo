// app/components/shell/app-header.tsx
"use client";

import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { cn } from "@/app/lib/utils";
import { Menu } from "lucide-react";

export function AppHeader({ className }: { className?: string }) {
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
		</header>
	);
}

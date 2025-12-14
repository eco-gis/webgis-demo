"use client";

import { Search, X } from "lucide-react";
import type { Map as Maplibre } from "maplibre-gl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/app/components/ui/popover";
import { Spinner } from "@/app/components/ui/spinner";
import { cn } from "@/app/lib/utils";
import { applySearchResult } from "./apply-search-results";
import { useGeocodingSearch } from "./use-geocoding-search";

export function SearchHeader({ map }: { map: Maplibre | null }) {
	const { query, setQuery, results, isLoading, error } = useGeocodingSearch();
	const [open, setOpen] = useState(false);

	const canSearch = Boolean(map);

	const showPanel = useMemo(() => {
		if (!canSearch) return false;
		if (query.trim().length > 0) return true;
		if (isLoading) return true;
		if (error) return true;
		return false;
	}, [canSearch, error, isLoading, query]);

	useEffect(() => {
		setOpen(showPanel);
	}, [showPanel]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div className="relative w-65 max-w-[45vw]">
					<Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Ort suchen (z.B. Zürich HB)"
						className="h-9 pl-8 pr-9"
						disabled={!canSearch}
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-0 top-0 h-9 w-9"
						onClick={() => setQuery("")}
						aria-label="Suche leeren"
						disabled={!canSearch || !query}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</PopoverTrigger>

			<PopoverContent
				align="end"
				side="bottom"
				sideOffset={8}
				className="w-90 p-2"
			>
				{isLoading ? (
					<div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
						<Spinner className="h-4 w-4" />
						Suche…
					</div>
				) : null}

				{error ? (
					<div className="px-2 py-2 text-xs text-destructive">{error}</div>
				) : null}

				<div className="max-h-64 space-y-1 overflow-auto">
					{results.length === 0 && !isLoading ? (
						<div className="px-2 py-2 text-xs text-muted-foreground">
							Keine Treffer.
						</div>
					) : (
						results.map((r) => (
							<button
								key={r.id}
								type="button"
								className={cn(
									"w-full rounded-md px-2 py-2 text-left text-xs hover:bg-accent",
									"focus:outline-none focus:ring-2 focus:ring-ring",
								)}
								onClick={() => {
									if (!map) return;
									applySearchResult(map, r);
									setQuery("");
									setOpen(false);
								}}
								disabled={!map}
								title={map ? "Zoom zu Treffer" : "Map noch nicht bereit"}
							>
								<div className="font-medium">{r.text}</div>
								<div className="text-muted-foreground">{r.place_name}</div>
							</button>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}

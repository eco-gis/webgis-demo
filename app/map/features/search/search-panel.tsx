"use client";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Spinner } from "@/app/components/ui/spinner";
import { cn } from "@/app/lib/utils";
import { Search, X } from "lucide-react";
import type { Map as Maplibre } from "maplibre-gl";
import { applySearchResult } from "./apply-search-results";
import { useGeocodingSearch } from "./use-geocoding-search";

export function SearchPanel({ map }: { map: Maplibre | null }) {
	const { query, setQuery, results, isLoading, error } = useGeocodingSearch();

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Ort suchen (z.B. Zürich HB)"
						className="pl-8"
					/>
				</div>

				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-9 w-9"
					onClick={() => setQuery("")}
					aria-label="Suche leeren"
					disabled={!query}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{isLoading && (
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<Spinner className="h-4 w-4" />
					Suche…
				</div>
			)}

			{error && <div className="text-xs text-destructive">{error}</div>}

			<div className="max-h-64 space-y-1 overflow-auto rounded-md border border-border p-1">
				{results.length === 0 && !isLoading ? (
					<div className="p-2 text-xs text-muted-foreground">
						Keine Treffer.
					</div>
				) : (
					results.map((r) => (
						<button
							key={r.id}
							type="button"
							className={cn(
								"w-full rounded px-2 py-2 text-left text-xs hover:bg-accent",
								"focus:outline-none focus:ring-2 focus:ring-ring",
							)}
							onClick={() => {
								if (!map) return;
								applySearchResult(map, r);
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
		</div>
	);
}

"use client";

import { Search, X } from "lucide-react";
import type { Map as Maplibre } from "maplibre-gl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Spinner } from "@/app/components/ui/spinner";
import { cn } from "@/app/lib/utils";
import { applySearchResult, clearSearchMarker } from "./apply-search-results";
import { useGeocodingSearch } from "./use-geocoding-search";

export function SearchHeader({ map }: { map: Maplibre | null }) {
	const { query, setQuery, results, isLoading, error } = useGeocodingSearch();
	const [open, setOpen] = useState(false);

	const canSearch = Boolean(map);

	const showPanel = useMemo(() => {
		// 1. Wenn die Map nicht da ist, niemals zeigen
		if (!canSearch) return false;

		const trimmedQuery = query.trim();

		// 2. Wenn das Feld komplett leer ist, niemals zeigen
		if (trimmedQuery.length === 0) return false;

		// 3. Zeigen, wenn wir laden, einen Fehler haben oder Ergebnisse existieren
		// (results.length === 0 zeigt die "Keine Treffer" Meldung)
		return isLoading || !!error || results.length >= 0;
	}, [canSearch, error, isLoading, query, results]);

	useEffect(() => {
		setOpen(showPanel);
	}, [showPanel]);

	const handleSelect = (result: (typeof results)[0]) => {
		if (!map) return;
		applySearchResult(map, result);
		setOpen(false);
	};

	const handleClear = () => {
		setQuery("");
		if (map) clearSearchMarker(map);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<div className="relative w-65 max-w-[45vw]">
					<Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && results.length > 0) {
								handleSelect(results[0]);
							}
						}}
						placeholder="Ort | Adresse suchen"
						className="h-9 pl-8 pr-9"
						disabled={!canSearch}
					/>
					{query && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
							onClick={handleClear}
							aria-label="Suche leeren">
							<X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
						</Button>
					)}
				</div>
			</PopoverTrigger>

			{open && (
				<PopoverContent
					align="start"
					side="bottom"
					sideOffset={8}
					className="w-90 p-2 shadow-xl"
					onOpenAutoFocus={(e) => e.preventDefault()}>
					{isLoading ? (
						<div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
							<Spinner className="h-3 w-3" />
							Suche läuft...
						</div>
					) : error ? (
						<div className="px-2 py-2 text-xs text-destructive bg-destructive/10 rounded-sm">{error}</div>
					) : results.length > 0 ? (
						<div className="max-h-64 space-y-1 overflow-y-auto">
							{results.map((r) => (
								<button
									key={r.id}
									type="button"
									className={cn(
										"w-full rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-accent",
										"focus:bg-accent focus:outline-none",
									)}
									onClick={() => handleSelect(r)}>
									<div className="font-medium line-clamp-1">{r.text}</div>
									<div className="text-[10px] text-muted-foreground line-clamp-1">{r.place_name}</div>
								</button>
							))}
						</div>
					) : query.trim().length > 0 ? (
						<div className="px-2 py-4 text-center text-xs text-muted-foreground">Keine Treffer für "{query}"</div>
					) : null}
				</PopoverContent>
			)}
		</Popover>
	);
}

// app/map/plugins/_template/components/template-point-popup.tsx
"use client";

import type { PopupRendererProps } from "@/app/map/features/popup/popup-registry";

/**
 * Custom Popup für Template-Punkte
 * 
 * Beispiel-Implementierung - passe an deine Datenstruktur an
 */
export function TemplatePointPopup({ feature }: PopupRendererProps) {
	// Feature-Properties extrahieren
	const name = feature.properties?.name || "Unbekannt";
	const description = feature.properties?.description;
	const value = feature.properties?.value;

	return (
		<div className="flex w-full min-w-0 flex-col gap-2">
			{/* Header */}
			<div className="min-w-0">
				<h3 className="truncate text-sm font-bold tracking-tight text-foreground">{name}</h3>
				{description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
			</div>

			{/* Daten */}
			{value !== undefined && (
				<div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
					<div className="text-muted-foreground">Wert</div>
					<div className="text-right font-medium">{value}</div>
				</div>
			)}

			{/* Weitere Custom-Inhalte hier */}
		</div>
	);
}

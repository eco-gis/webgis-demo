// app/map/features/popup/popup-overlay.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import type { MapPopupData } from "./types";

type PopupOverlayProps = {
	popup: MapPopupData;
	onClose: () => void;
};

export function PopupOverlay({ popup, onClose }: PopupOverlayProps) {
	const feature = popup.features[0];
	const props = feature.properties ?? {};

	return (
		<div className="absolute left-4 top-4 z-50 max-w-sm">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-sm">Objektinfo</CardTitle>
					<Button variant="ghost" size="sm" onClick={onClose}>
						✕
					</Button>
				</CardHeader>
				<CardContent className="space-y-1 text-xs">
					{Object.entries(props).map(([key, value]) => (
						<div key={key} className="flex justify-between gap-2">
							<span className="text-muted-foreground">{key}</span>
							<span className="font-mono truncate">{String(value)}</span>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

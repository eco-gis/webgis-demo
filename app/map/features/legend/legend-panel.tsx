// app/map/features/legend/legend-panel.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/app/components/ui/sheet";
import { useIsMobile } from "@/app/hooks/use-mobile";
import { useTocStore } from "@/app/map/features/toc/toc-store";
import { MAP_CONFIG } from "@/app/map/map-config";
import { List } from "lucide-react";

function Swatch({
	kind,
	value,
}: {
	kind: "fill" | "line" | "circle";
	value: string;
}) {
	if (kind === "circle") {
		return (
			<span
				className="h-3 w-3 rounded-full"
				style={{ backgroundColor: value }}
			/>
		);
	}
	if (kind === "line") {
		return (
			<span className="h-0.5 w-6 rounded" style={{ backgroundColor: value }} />
		);
	}
	return (
		<span
			className="h-3 w-6 rounded-sm"
			style={{ backgroundColor: value, opacity: 0.6 }}
		/>
	);
}

function LegendContent() {
	const visible = useTocStore((s) => s.visible);

	const items = MAP_CONFIG.tocItems.filter(
		(i) => (visible[i.id] ?? i.defaultVisible) && i.legend?.length,
	);

	return (
		<div className="space-y-4">
			{items.map((item) => (
				<div key={item.id} className="space-y-2">
					<div className="text-xs font-medium">{item.title}</div>
					<div className="space-y-1">
						{item.legend?.map((li) => (
							<div key={li.label} className="flex items-center gap-2 text-xs">
								<Swatch kind={li.swatch.kind} value={li.swatch.value} />
								<span className="text-muted-foreground">{li.label}</span>
							</div>
						))}
					</div>
					<Separator />
				</div>
			))}

			{items.length === 0 && (
				<div className="text-xs text-muted-foreground">
					Keine sichtbaren Layer mit Legende.
				</div>
			)}
		</div>
	);
}

export function LegendPanel() {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<div className="absolute right-3 top-3 z-9999">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="secondary" size="sm" className="gap-2 shadow">
							<List className="h-4 w-4" />
							Legende
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-[320px]">
						<SheetHeader>
							<SheetTitle>Legende</SheetTitle>
						</SheetHeader>
						<div className="mt-4">
							<LegendContent />
						</div>
					</SheetContent>
				</Sheet>
			</div>
		);
	}

	return (
		<div className="absolute right-3 top-3 z-9999 w-70">
			<Card className="shadow">
				<CardHeader>
					<CardTitle className="text-sm">Legende</CardTitle>
				</CardHeader>
				<CardContent>
					<LegendContent />
				</CardContent>
			</Card>
		</div>
	);
}

// app/map/features/toc/toc-panel.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/app/components/ui/sheet";
import { Slider } from "@/app/components/ui/slider";
import { Switch } from "@/app/components/ui/switch";
import { useIsMobile } from "@/app/hooks/use-mobile";
import { MAP_CONFIG } from "@/app/map/config/map-config";
import { Layers } from "lucide-react";
import { useTocStore } from "./toc-store";

function TocContent() {
	const visible = useTocStore((s) => s.visible);
	const labelsVisible = useTocStore((s) => s.labelsVisible);
	const opacity = useTocStore((s) => s.opacity);
	const setVisible = useTocStore((s) => s.setVisible);
	const setLabelsVisible = useTocStore((s) => s.setLabelsVisible);
	const setOpacity = useTocStore((s) => s.setOpacity);

	return (
		<div className="space-y-4">
			{MAP_CONFIG.tocItems.map((item) => {
				const isOn = visible[item.id] ?? item.defaultVisible;
				const labelsOn = labelsVisible[item.id] ?? item.defaultLabelsVisible;
				const op = opacity[item.id] ?? item.defaultOpacity;

				return (
					<Card key={item.id}>
						<CardHeader className="space-y-1">
							<CardTitle className="text-sm">{item.title}</CardTitle>
						</CardHeader>

						<CardContent className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<Label className="text-xs">Sichtbar</Label>
								<Switch
									checked={isOn}
									onCheckedChange={(v) => setVisible(item.id, v)}
								/>
							</div>

							<div className="flex items-center justify-between gap-3">
								<Label className="text-xs">Labels</Label>
								<Switch
									checked={labelsOn}
									onCheckedChange={(v) => setLabelsVisible(item.id, v)}
									disabled={!isOn}
								/>
							</div>

							<Separator />

							<div className="space-y-2">
								<Label className="text-xs">Opacity</Label>
								<Slider
									value={[op]}
									min={0}
									max={1}
									step={0.05}
									onValueChange={(v) =>
										setOpacity(item.id, v[0] ?? item.defaultOpacity)
									}
									disabled={!isOn}
								/>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export function TocPanel() {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<div className="absolute left-3 top-3 z-9999">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="secondary" size="sm" className="gap-2 shadow">
							<Layers className="h-4 w-4" />
							Layer
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-[320px]">
						<SheetHeader>
							<SheetTitle>Layer</SheetTitle>
						</SheetHeader>
						<div className="mt-4">
							<TocContent />
						</div>
					</SheetContent>
				</Sheet>
			</div>
		);
	}

	// Desktop: festes Panel
	return (
		<div className="absolute left-3 top-3 z-9999 w-[320px]">
			<Card className="shadow">
				<CardHeader>
					<CardTitle className="text-sm">Layer</CardTitle>
				</CardHeader>
				<CardContent>
					<TocContent />
				</CardContent>
			</Card>
		</div>
	);
}

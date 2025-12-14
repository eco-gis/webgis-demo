"use client";

import Image from "next/image";

import { Slider } from "@/app/components/ui/slider";
import { cn } from "@/app/lib/utils";
import type { BasemapDef, BasemapId } from "./basemap-config";
import { isBasemapId } from "./basemap-config";

export type BasemapGridProps = {
	value: BasemapId;
	onChange: (id: BasemapId) => void;
	options: readonly BasemapDef[];
	className?: string;
	columns?: 2 | 3;

	/** optional opacity control (0..1) */
	opacity?: number;
	onOpacityChange?: (opacity: number) => void;
	showOpacity?: boolean;
};

function clamp01(n: number): number {
	if (n < 0) return 0;
	if (n > 1) return 1;
	return n;
}

export function BasemapGrid({
	value,
	onChange,
	options,
	className,
	columns = 2,
	opacity,
	onOpacityChange,
	showOpacity = false,
}: BasemapGridProps) {
	const opacityPct =
		typeof opacity === "number" ? Math.round(clamp01(opacity) * 100) : null;

	return (
		<div className={cn("space-y-3", className)}>
			<div className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : "grid-cols-3")}>
				{options.map((b) => {
					const active = b.id === value;

					return (
						<button
							key={b.id}
							type="button"
							onClick={() => {
								if (!isBasemapId(b.id)) return;
								onChange(b.id);
							}}
							className={cn(
								"group relative overflow-hidden rounded-xl border bg-muted",
								active ? "border-ring" : "border-border",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							)}
							aria-pressed={active}
							title={b.label}
						>
							<div className="relative aspect-square w-full">
								{b.thumbnailUrl ? (
									<Image
										src={b.thumbnailUrl}
										alt={b.label}
										fill
										sizes="140px"
										className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
										priority={false}
									/>
								) : null}

								<div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-black/60 to-transparent" />

								<div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-2">
									<div className="min-w-0">
										<div className="truncate text-[12px] font-medium text-white drop-shadow">
											{b.label}
										</div>
									</div>

									{active ? (
										<div className="shrink-0 rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-medium text-black backdrop-blur">
											Aktiv
										</div>
									) : null}
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{showOpacity && typeof opacity === "number" && onOpacityChange ? (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="text-[11px] text-muted-foreground">Deckkraft</div>
						<div className="text-[11px] tabular-nums text-muted-foreground">
							{opacityPct}%
						</div>
					</div>

					<Slider
						value={[clamp01(opacity)]}
						min={0}
						max={1}
						step={0.05}
						onValueChange={(v) => {
							const next = v[0];
							if (typeof next !== "number") return;
							onOpacityChange(clamp01(next));
						}}
					/>
				</div>
			) : null}
		</div>
	);
}

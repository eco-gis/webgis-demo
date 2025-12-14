// app/map/basemaps/basemap-gallery.tsx

"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import type { BasemapDef, BasemapId } from "./basemap-config";
import { BASEMAPS, getBasemapById, isBasemapId } from "./basemap-config";

export type BasemapGalleryProps = {
	value: BasemapId;
	onChange: (id: BasemapId) => void;
	options?: readonly BasemapDef[];
	label?: string;
	showDescription?: boolean;
	className?: string;
	hydrated?: boolean;
};

export function BasemapGallery({
	value,
	onChange,
	options = BASEMAPS,
	label = "Basemap",
	showDescription = true,
	className,
	hydrated,
}: BasemapGalleryProps) {
	const selected = getBasemapById(value);

	return (
		<div className={className}>
			{label ? (
				<div className="mb-2 text-[11px] font-medium text-muted-foreground">
					{label}
				</div>
			) : null}

			<Select
				value={value}
				onValueChange={(v) => {
					if (!isBasemapId(v)) return;
					onChange(v);
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Basemap wählen" />
				</SelectTrigger>

				<SelectContent>
					{options.map((b) => (
						<SelectItem key={b.id} value={b.id}>
							<div className="flex flex-col">
								<span>{b.label}</span>
								{b.description ? (
									<span className="text-[11px] text-muted-foreground">
										{b.description}
									</span>
								) : null}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{showDescription && hydrated && selected.description ? (
				<>
					<Separator className="my-3" />
					<p className="text-[11px] text-muted-foreground">
						{selected.description}
					</p>
				</>
			) : null}
		</div>
	);
}

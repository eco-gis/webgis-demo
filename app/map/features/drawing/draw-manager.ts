import type maplibregl from "maplibre-gl";
import { DRAW_SOURCE_ID } from "./draw-layer";
import type { DrawState } from "./draw-state";

type MapClickHandler = (
	e: maplibregl.MapMouseEvent,
) => void;

export class DrawManager {
	private onClick: MapClickHandler;

	constructor(
		private map: maplibregl.Map,
		private state: DrawState,
		private onUpdate: () => void,
	) {
		this.onClick = (e) => {
			if (!this.state.isDrawing) return;

			this.state.coords.push([e.lngLat.lng, e.lngLat.lat]);
			this.updateSource();
			this.onUpdate();
		};

		this.map.on("click", this.onClick);
	}

	public destroy(): void {
		this.map.off("click", this.onClick);
	}

	private updateSource(): void {
		const source = this.map.getSource(DRAW_SOURCE_ID) as
			| maplibregl.GeoJSONSource
			| undefined;
		if (!source) return;

		if (this.state.coords.length < 3) {
			source.setData({ type: "FeatureCollection", features: [] });
			return;
		}

		const ring = [...this.state.coords, this.state.coords[0]];

		source.setData({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					properties: {},
					geometry: { type: "Polygon", coordinates: [ring] },
				},
			],
		});
	}

	public reset(): void {
		this.state.coords = [];
		this.state.isDrawing = false;
		this.updateSource();
		this.onUpdate();
	}
}

// app/map/core/map-instance.ts
import { mapTilerStyleUrl } from "@/app/lib/maptiler/styles";
import maplibregl, {
	type LngLatLike,
	type Map as MaplibreMap,
} from "maplibre-gl";

type CreateMapOptions = {
	container: HTMLDivElement;
	center: LngLatLike;
	zoom: number;
};

export function createMap({
	container,
	center,
	zoom,
}: CreateMapOptions): MaplibreMap {
	const map = new maplibregl.Map({
		container,
		style: mapTilerStyleUrl("streets-v2"),
		center,
		zoom,
	});

	// ✅ Debug: Map in Console verfügbar machen
	if (process.env.NODE_ENV !== "production") {
		(window as unknown as { __map?: MaplibreMap }).__map = map;
	}

	map.addControl(
		new maplibregl.NavigationControl({ visualizePitch: true }),
		"top-right",
	);
	map.addControl(
		new maplibregl.ScaleControl({ unit: "metric" }),
		"bottom-left",
	);

	return map;
}

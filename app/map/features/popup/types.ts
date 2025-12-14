// app/map/features/popup/types.ts
import type maplibregl from "maplibre-gl";

export type PopupFeature = maplibregl.MapGeoJSONFeature;

export type PopupLayerGroup = {
	layerId: string;
	features: PopupFeature[];
};

export type PopupState =
	| { open: false }
	| {
			open: true;
			lngLat: maplibregl.LngLatLike;
			groups: PopupLayerGroup[];
	  };

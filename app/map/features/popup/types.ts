// app/map/features/popup/types.ts
import type { LngLatLike, MapGeoJSONFeature } from "maplibre-gl"

export type MapPopupData = {
  lngLat: LngLatLike
  features: MapGeoJSONFeature[]
}

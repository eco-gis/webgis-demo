// app/map/features/coords/lv95.ts
import proj4 from "proj4";

const EPSG2056 =
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 " +
  "+k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel " +
  "+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs";

proj4.defs("EPSG:2056", EPSG2056);
proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

export type Lv95 = { e: number; n: number };

export function wgs84ToLv95(lon: number, lat: number): Lv95 {
  const [e, n] = proj4("EPSG:4326", "EPSG:2056", [lon, lat]) as [number, number];
  return { e, n };
}

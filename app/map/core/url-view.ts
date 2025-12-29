// app/map/core/url-view.ts
export type UrlView = {
  lon: number; // WGS84
  lat: number; // WGS84
  zoom: number;
  bearing?: number;
  pitch?: number;
};

function asFiniteNumber(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function readViewFromUrl(search: string): UrlView | null {
  const sp = new URLSearchParams(search);

  const lon = asFiniteNumber(sp.get("lon"));
  const lat = asFiniteNumber(sp.get("lat"));
  const zoom = asFiniteNumber(sp.get("z"));

  if (lon === null || lat === null || zoom === null) return null;

  const bearing = asFiniteNumber(sp.get("b")) ?? undefined;
  const pitch = asFiniteNumber(sp.get("p")) ?? undefined;

  return { lon, lat, zoom, bearing, pitch };
}

export function writeViewToUrl(view: UrlView, prevSearch: string): string {
  const sp = new URLSearchParams(prevSearch);

  sp.set("lon", view.lon.toFixed(6));
  sp.set("lat", view.lat.toFixed(6));
  sp.set("z", view.zoom.toFixed(2));

  if (view.bearing !== undefined) sp.set("b", view.bearing.toFixed(0));
  else sp.delete("b");

  if (view.pitch !== undefined) sp.set("p", view.pitch.toFixed(0));
  else sp.delete("p");

  const s = sp.toString();
  return s.length > 0 ? `?${s}` : "";
}

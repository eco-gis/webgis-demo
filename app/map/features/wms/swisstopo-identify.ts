// app/map/features/wms/swisstopo-identify.ts

export async function identifySwisstopoFeatures(
    map: maplibregl.Map,
    lngLat: { lng: number; lat: number },
    layers: string[]
) {
    if (layers.length === 0) return null;

    const canvas = map.getCanvas();
    const bounds = map.getBounds();
    
    // Parameter für die API
    const params = new URLSearchParams({
        geometry: `${lngLat.lng},${lngLat.lat}`,
        geometryType: "esriGeometryPoint",
        sr: "4326", // WGS84
        layers: `all:${layers.join(",")}`,
        tolerance: "10", // Suchradius in Pixeln
        mapExtent: bounds.toArray().flat().join(","),
        imageDisplay: `${canvas.clientWidth},${canvas.clientHeight},96`,
        returnGeometry: "true",
        lang: "de"
    });

    const url = `https://api3.geo.admin.ch/rest/services/all/MapServer/identify?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Identify Request fehlgeschlagen");
        return await response.json();
    } catch (err) {
        console.error("Swisstopo Identify Error:", err);
        return null;
    }
}
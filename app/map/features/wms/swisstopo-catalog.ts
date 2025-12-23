// app/map/features/wms/swisstopo-catalog.ts

export type SwisstopoLayerConfig = {
	id: string;
	title: string;
	format: string;
	isWmts: boolean;
};

export async function loadSwisstopoCatalog(): Promise<SwisstopoLayerConfig[]> {
	const res = await fetch("https://api3.geo.admin.ch/rest/services/all/MapServer/layersConfig?lang=de");
	if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
	const data = await res.json();

	return Object.keys(data)
		.filter((key) => key.startsWith("ch.swisstopo."))
		.map((key) => {
			const rawName = data[key].name || key;

			// Schönheitskur für den Titel:
			// 1. Präfix weg, 2. Bindestriche zu Leerzeichen, 3. Capitalize
			const cleanTitle = rawName
				.replace("ch.swisstopo.", "")
				.replace(/-/g, " ")
				.replace(/\b\w/g, (l: string) => l.toUpperCase());

			return {
				id: key,
				title: cleanTitle,
				format: data[key].format || "png",
				isWmts: data[key].type === "wmts",
			};
		})
		.sort((a, b) => a.title.localeCompare(b.title, "de"));
}

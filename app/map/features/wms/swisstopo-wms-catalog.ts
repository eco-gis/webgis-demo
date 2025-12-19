// app/map/features/swisstopo/swisstopo-catalog.ts

export type SwisstopoLayerInfo = {
	id: string;
	title: string;
	abstract?: string;
	format: string;
};

const LAYERS_CONFIG_URL =
	"https://api3.geo.admin.ch/rest/services/Config/layersConfig?lang=de";

export async function loadSwisstopoCatalog(): Promise<SwisstopoLayerInfo[]> {
	const res = await fetch(LAYERS_CONFIG_URL);
	if (!res.ok) throw new Error(`Katalog-Fehler: ${res.status}`);

	const data = await res.json();

	return Object.keys(data)
		.map((key) => ({
			id: key,
			title: data[key].name,
			abstract: data[key].abstract,
			format: data[key].format,
		}))
		.sort((a, b) => a.title.localeCompare(b.title, "de"));
}
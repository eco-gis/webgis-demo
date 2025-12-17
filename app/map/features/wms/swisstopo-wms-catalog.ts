export type SwisstopoWmsLayerInfo = {
	name: string;
	title: string;
	abstract?: string;
};

const CAPABILITIES_URL =
	"https://wms.geo.admin.ch/?REQUEST=GetCapabilities&SERVICE=WMS&VERSION=1.3.0&lang=de";

let cache: SwisstopoWmsLayerInfo[] | null = null;

function firstText(el: Element, tag: string): string | undefined {
	const node = el.getElementsByTagName(tag)[0];
	const t = node?.textContent?.trim();
	return t && t.length > 0 ? t : undefined;
}

function parseCapabilitiesXml(xmlText: string): SwisstopoWmsLayerInfo[] {
	const doc = new DOMParser().parseFromString(xmlText, "text/xml");

	// WMS 1.3.0: <Layer>...</Layer>, Layer können nested sein.
	// Wir nehmen alle Layer, die ein <Name> haben (das sind “echte” abfragbare Layer).
	const layers = Array.from(doc.getElementsByTagName("Layer"));

	const out: SwisstopoWmsLayerInfo[] = [];
	for (const layer of layers) {
		const name = firstText(layer, "Name");
		if (!name) continue;

		const title = firstText(layer, "Title") ?? name;
		const abstract = firstText(layer, "Abstract");

		out.push({ name, title, abstract });
	}

	// optional: sortiert nach Title
	out.sort((a, b) => a.title.localeCompare(b.title, "de"));

	return out;
}

function dedupeByName(items: SwisstopoWmsLayerInfo[]): SwisstopoWmsLayerInfo[] {
	const seen = new Set<string>();
	const out: SwisstopoWmsLayerInfo[] = [];

	for (const it of items) {
		if (seen.has(it.name)) continue;
		seen.add(it.name);
		out.push(it);
	}
	return out;
}


export async function loadSwisstopoWmsCatalog(): Promise<SwisstopoWmsLayerInfo[]> {
	if (cache) return cache;

	const res = await fetch(CAPABILITIES_URL, { cache: "no-store" });
	if (!res.ok) throw new Error(`GetCapabilities failed (HTTP ${res.status})`);

	const xml = await res.text();
	const parsed = parseCapabilitiesXml(xml);

	cache = dedupeByName(parsed).sort((a, b) => a.title.localeCompare(b.title, "de"));
	return cache;
}


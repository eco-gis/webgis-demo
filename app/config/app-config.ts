// app/config/app-config.ts

/**
 * Zentrale App-Konfiguration
 * Werte können über Umgebungsvariablen überschrieben werden
 */

export const APP_CONFIG = {
	/** Haupt-Titel der Anwendung */
	title: process.env.NEXT_PUBLIC_APP_TITLE || "WebGIS Demo",

	/** Untertitel (optional) */
	subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || "",

	/** Kurzbeschreibung für SEO */
	description:
		process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
		"Interaktive WebGIS-Demo von eco|gis. Moderne Kartenanwendung mit Layern, Legende und klarer UI – als Referenz für Prototypen und Pilotprojekte.",

	/** OpenGraph Titel (falls abweichend vom Haupt-Titel) */
	ogTitle: process.env.NEXT_PUBLIC_OG_TITLE || process.env.NEXT_PUBLIC_APP_TITLE || "Demo WebGIS – eco|gis",

	/** OpenGraph Beschreibung */
	ogDescription:
		process.env.NEXT_PUBLIC_OG_DESCRIPTION ||
		"Moderne WebGIS-Demo von eco|gis: interaktive Karten, saubere UI, ideal für Pilotierungen und Fachanwendungen.",

	/** Base URL für absolute Links */
	baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://demo-webgis.eco-gis.ch",

	/** Locale für Internationalisierung */
	locale: process.env.NEXT_PUBLIC_LOCALE || "de_CH",

	/** Twitter Card Titel */
	twitterTitle:
		process.env.NEXT_PUBLIC_TWITTER_TITLE || process.env.NEXT_PUBLIC_APP_TITLE || "Demo WebGIS – eco|gis",

	/** Twitter Card Beschreibung */
	twitterDescription:
		process.env.NEXT_PUBLIC_TWITTER_DESCRIPTION ||
		"Interaktive WebGIS-Demo von eco|gis. Referenz für moderne, schlanke Kartenanwendungen.",

	/** Map-Konfiguration */
	map: {
		/** Standard-Kartenzentrum [lon, lat] */
		center: process.env.NEXT_PUBLIC_MAP_CENTER || "8.64,47.695",

		/** Standard-Zoom-Level */
		zoom: process.env.NEXT_PUBLIC_MAP_ZOOM || "12",

		/** MapTiler Style URL (für Custom Styles) */
		waldkauzStyleUrl: process.env.NEXT_PUBLIC_WALDKAUZ_STYLE_URL || null,
	},
} as const;

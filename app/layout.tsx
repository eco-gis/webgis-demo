// app/layout.tsx

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

// Inter Display (klar, technisch, passt zu WebGIS)
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://demo-webgis.eco-gis.ch"),

	title: {
		default: "Demo WebGIS – eco|gis",
		template: "%s – Demo WebGIS | eco|gis",
	},

	description:
		"Interaktive WebGIS-Demo von eco|gis. Moderne Kartenanwendung mit Layern, Legende und klarer UI – als Referenz für Prototypen und Pilotprojekte.",

	robots: {
		index: true,
		follow: true,
	},

	openGraph: {
		type: "website",
		locale: "de_CH",
		url: "https://demo-webgis.eco-gis.ch",
		siteName: "eco|gis – Demo WebGIS",
		title: "Demo WebGIS – eco|gis",
		description:
			"Moderne WebGIS-Demo von eco|gis: interaktive Karten, saubere UI, ideal für Pilotierungen und Fachanwendungen.",
	},

	twitter: {
		card: "summary_large_image",
		title: "Demo WebGIS – eco|gis",
		description:
			"Interaktive WebGIS-Demo von eco|gis. Referenz für moderne, schlanke Kartenanwendungen.",
	},

	alternates: {
		canonical: "https://demo-webgis.eco-gis.ch",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="de" className={inter.variable}>
			<body className="font-sans antialiased">
				{children}
				<Analytics />
			</body>
		</html>
	);
}

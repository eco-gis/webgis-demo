// app/layout.tsx
import "maplibre-gl/dist/maplibre-gl.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Demo WebGIS - eco|gis",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="de">
			<body>{children}</body>
		</html>
	);
}

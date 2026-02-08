// app/layout.tsx

import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { APP_CONFIG } from "@/app/config/app-config";
import { Providers } from "@/app/providers";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

// Inter Display (klar, technisch, passt zu WebGIS)
const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-inter",
});

export const metadata: Metadata = {
	metadataBase: new URL(APP_CONFIG.baseUrl),

	title: {
		default: APP_CONFIG.title,
		template: `%s – ${APP_CONFIG.title}`,
	},

	description: APP_CONFIG.description,

	robots: {
		index: true,
		follow: true,
	},

	openGraph: {
		type: "website",
		locale: APP_CONFIG.locale,
		url: APP_CONFIG.baseUrl,
		siteName: APP_CONFIG.title,
		title: APP_CONFIG.ogTitle,
		description: APP_CONFIG.ogDescription,
	},

	twitter: {
		card: "summary_large_image",
		title: APP_CONFIG.twitterTitle,
		description: APP_CONFIG.twitterDescription,
	},

	alternates: {
		canonical: APP_CONFIG.baseUrl,
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="de" className={inter.variable}>
			<Analytics />
			<body className="font-sans antialiased">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}

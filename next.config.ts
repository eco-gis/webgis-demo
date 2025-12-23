import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [{ protocol: "https", hostname: "api3.geo.admin.ch", pathname: "/**" }],
	},
};

export default nextConfig;

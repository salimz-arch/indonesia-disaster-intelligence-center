import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages: NEXT_OUTPUT=export → static out/
  // Docker lokal/Render: default standalone
  output: process.env.NEXT_OUTPUT === "export" ? "export" : "standalone",
  devIndicators: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;

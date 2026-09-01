import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker lokal (default)          → standalone
  // Vercel   (NEXT_OUTPUT=none)     → default (Vercel native)
  // Static   (NEXT_OUTPUT=export)   → export (jika suatu saat perlu)
  output:
    process.env.NEXT_OUTPUT === "export"
      ? "export"
      : process.env.NEXT_OUTPUT === "none"
        ? undefined
        : "standalone",
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


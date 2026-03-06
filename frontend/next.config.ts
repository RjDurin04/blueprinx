import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Explicitly allow the dev origin to avoid cross-origin detection overhead
    // @ts-ignore - allowedDevOrigins is supported in Next.js 15 Turbopack but types may lag
    allowedDevOrigins: ["localhost:3000", "10.130.18.120:3000"],
  },
  devIndicators: {
    appIsrStatus: false, // Reduce server-to-client status polling overhead
  },
};

export default nextConfig;

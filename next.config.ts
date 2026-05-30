import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: false,
  },
  allowedDevOrigins: ["100.107.132.117", "localhost:3000"],
};

export default nextConfig;


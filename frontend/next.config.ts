import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for React 19
  reactStrictMode: true,
  
  // TypeScript and ESLint configuration
  typescript: {
    // Ignore TypeScript errors during build (for now)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build (for now)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

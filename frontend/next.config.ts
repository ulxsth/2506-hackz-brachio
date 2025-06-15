import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for React 19
  reactStrictMode: true,
  
  // Rewrites for API proxy (development)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*', // API server
      },
    ];
  },
};

export default nextConfig;

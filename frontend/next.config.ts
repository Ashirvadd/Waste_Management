import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development-friendly configuration
  reactStrictMode: true,
  
  // Image configuration
  images: {
    unoptimized: true
  },
  
  // Development server configuration
  experimental: {
    // Enable faster refresh
    optimizePackageImports: ['react-icons']
  }
};

export default nextConfig;

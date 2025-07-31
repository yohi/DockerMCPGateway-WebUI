import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://mcp-backend:5311/api/:path*',
      },
    ];
  },
};

export default nextConfig;

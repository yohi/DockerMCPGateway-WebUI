/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  output: 'standalone',
  async rewrites() {
    // 開発環境かどうかをチェック
    const isDev = process.env.NODE_ENV === 'development';
    const backendUrl = isDev ? 'http://localhost:3002' : 'http://mcp-backend:5311';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

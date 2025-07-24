/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false,
  },
  output: 'standalone',
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:2567',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:2567',
  },
  async rewrites() {
    return [
      {
        source: '/api/game/:path*',
        destination: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig

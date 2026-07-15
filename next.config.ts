import type { NextConfig } from 'next'

const apiOrigin = (process.env.CHAT_API_ORIGIN || 'http://127.0.0.1:8013').replace(/\/$/, '')

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/chat/embed',
        destination: '/embed',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/sanctum/:path*', destination: `${apiOrigin}/sanctum/:path*` },
    ]
  },
  async headers() {
    return [
      {
        source: '/embed',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://dogeow.com https://*.dogeow.com",
          },
        ],
      },
      {
        source: '/embed.js',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' },
        ],
      },
    ]
  },
}

export default nextConfig

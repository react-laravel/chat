import type { NextConfig } from 'next'

const apiOrigin = (process.env.CHAT_API_ORIGIN || 'http://127.0.0.1:8013').replace(/\/$/, '')

const embedOrigins =
  process.env.CHAT_EMBED_ORIGINS === undefined
    ? ['https://dogeow.com', 'https://*.dogeow.com']
    : process.env.CHAT_EMBED_ORIGINS.split(',')
        .map(value => value.trim())
        .filter(Boolean)
        .map(value => {
          const origin = new URL(value)
          if (
            !['http:', 'https:'].includes(origin.protocol) ||
            origin.username ||
            origin.password ||
            origin.pathname !== '/' ||
            origin.search ||
            origin.hash
          ) {
            throw new Error('CHAT_EMBED_ORIGINS must contain comma-separated http(s) origins')
          }
          return origin.origin
        })

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { proxyClientMaxBodySize: '12mb' },
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
        source: '/chat',
        headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }],
      },
      {
        source: '/auth/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "frame-ancestors 'self'" }],
      },
      {
        source: '/embed',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors 'self' ${embedOrigins.join(' ')}`,
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

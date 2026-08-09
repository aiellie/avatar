import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Shards are addressed with `?v=<package version>`, so a given URL's
        // contents never change.
        source: '/hugeicons/s/:shard*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // The index is the thing that hands out the current version, so it
        // only gets a short window.
        source: '/hugeicons/index.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/api/avatar/:path*',
      },
    ]
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Mark static assets as cacheable (let Cloudflare control duration)
        source: '/_next/static',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, immutable',
          }
        ],
      },
      {
        // Mark optimized images as cacheable (let Cloudflare control duration)
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, immutable',
          }
        ],
      }
    ]
  },
}

module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Mark static assets as cacheable (let Cloudflare control duration)
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public',
          },
        ],
      },
      {
        // Mark optimized images as cacheable (let Cloudflare control duration)
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public',
          },
        ],
      },
      {
        // Mark public folder assets as cacheable (let Cloudflare control duration)
        source: '/(.*\\.(ico|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public',
          },
        ],
      },
    ]
  },
  images: {
    // Keep default image optimization settings
    minimumCacheTTL: 60, // 1 minute minimum (Cloudflare will extend this)
  },
}

module.exports = nextConfig 
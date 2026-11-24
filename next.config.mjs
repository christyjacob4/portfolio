/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export for Cloudflare Pages. Pages serves /blog/x.html at
  // /blog/x and redirects /blog/x/ -> /blog/x, so trailingSlash stays false.
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;

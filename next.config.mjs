/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static export for Cloudflare Pages. Pages serves /blog/x.html at
  // /blog/x and redirects /blog/x/ -> /blog/x, so trailingSlash stays false.
  output: "export",
  trailingSlash: false,
  // Images are resized at build time by scripts/optimize-images.mjs (run via
  // the prebuild/predev npm scripts); the loader maps next/image requests to
  // those files. The size lists below drive both the loader and the script.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    imageSizes: [64, 128, 256, 384],
    deviceSizes: [640, 828, 1080, 1200, 1920],
  },
};

export default nextConfig;

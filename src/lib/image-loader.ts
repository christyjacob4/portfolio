import type { ImageLoaderProps } from "next/image";
import manifest from "./image-manifest.json";

// Maps local raster sources to the WebP variants generated at build time by
// scripts/optimize-images.mjs. Anything else (remote URLs, SVG, GIF, sources
// not in the manifest) is served as-is. Quality is fixed at generation time.
export default function imageLoader({ src, width }: ImageLoaderProps): string {
  const hash = (manifest as Record<string, string>)[src];
  if (!hash) return src;
  return `/_img/${src.slice(1).replace(/\.[^.]+$/, "")}-${hash}-${width}.webp`;
}

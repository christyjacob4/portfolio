// Build-time image pipeline for next/image in static export.
// Writes WebP variants of every raster image under public/ to public/_img/
// and a src -> content-hash manifest consumed by src/lib/image-loader.ts.
// Variants are named <path>-<hash>-<width>.webp so they can be cached forever.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const outDir = path.join(publicDir, "_img");
const manifestPath = path.join(root, "src/lib/image-manifest.json");

// Must stay in sync with images.deviceSizes + images.imageSizes in next.config.mjs.
const { default: config } = await import(path.join(root, "next.config.mjs"));
const WIDTHS = [...config.images.imageSizes, ...config.images.deviceSizes].sort(
  (a, b) => a - b,
);
const QUALITY = 75;
const CONCURRENCY = 4;
const SKIP = /^(favicon|android-chrome|apple-touch-icon)/;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (full === outDir) continue;
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const sources = [];
for await (const file of walk(publicDir)) {
  if (/\.(png|jpe?g)$/i.test(file) && !SKIP.test(path.basename(file))) {
    sources.push(file);
  }
}

const manifest = {};
const keep = new Set();
const tasks = [];

for (const file of sources) {
  const src = "/" + path.relative(publicDir, file).split(path.sep).join("/");
  const bytes = await readFile(file);
  const hash = createHash("sha1")
    .update(bytes)
    .update(`q${QUALITY}`)
    .digest("hex")
    .slice(0, 8);
  manifest[src] = hash;
  const base = src.slice(1).replace(/\.[^.]+$/, "");
  const missing = WIDTHS.filter((w) => {
    const out = path.join(outDir, `${base}-${hash}-${w}.webp`);
    keep.add(out);
    return !existsSync(out);
  });
  if (missing.length) tasks.push({ bytes, base, hash, missing });
}

async function run({ bytes, base, hash, missing }) {
  const meta = await sharp(bytes).metadata();
  const cache = new Map(); // effective width -> encoded buffer (never upscale)
  for (const w of missing) {
    const eff = Math.min(w, meta.width);
    if (!cache.has(eff)) {
      cache.set(
        eff,
        await sharp(bytes)
          .rotate()
          .resize({ width: eff, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toBuffer(),
      );
    }
    const out = path.join(outDir, `${base}-${hash}-${w}.webp`);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, cache.get(eff));
  }
}

const started = Date.now();
const queue = [...tasks];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await run(queue.shift());
  }),
);

// Drop variants whose source changed or disappeared.
if (existsSync(outDir)) {
  for await (const file of walk(outDir)) {
    if (!keep.has(file)) await rm(file);
  }
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `optimize-images: ${sources.length} sources, ${tasks.length} (re)generated, ${((Date.now() - started) / 1000).toFixed(1)}s`,
);

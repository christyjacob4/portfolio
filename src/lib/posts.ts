// Client-safe helpers (no fs).

/** "KV Caching - Making Transformers Fast" -> { main, deck } */
export function titleParts(title: string): { main: string; deck?: string } {
  const i = title.indexOf(" - ");
  if (i === -1) return { main: title };
  return { main: title.slice(0, i), deck: title.slice(i + 3) };
}

export function formatPostDate(date: string, opts?: { short?: boolean }) {
  const d = new Date(date.includes("T") ? date : `${date}T00:00:00`);
  return d.toLocaleString("en-US", {
    month: opts?.short ? "short" : "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Resized cover variants live next to the original (see scripts/make-thumbs.sh). */
export function coverVariant(src: string | undefined, w: 720 | 1280) {
  if (!src) return undefined;
  return src.replace(/\.(jpg|png)$/i, `-${w}.jpg`);
}

export type PostCard = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  image?: string;
  minutes: number;
  topic: string;
};

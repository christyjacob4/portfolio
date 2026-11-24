import { getBlogPosts } from "@/app/blog/utils";
import { renderOg } from "@/lib/og";

// Build-time OG image at /blog/<slug>/og.png (real .png extension so any static
// host serves the right content type).
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = getBlogPosts().find((p) => p.slug === params.slug);
  return renderOg(post?.metadata.title ?? "Christy Jacob", "christyjacob.dev / blog");
}

import { getBlogPosts, readingMinutes } from "@/app/blog/utils";
import { topicOf } from "@/data/topics";
import type { PostCard } from "@/lib/posts";

/** Light-weight post list (no MDX body) for index/home pages, newest first. */
export function getPostCards(): PostCard[] {
  return getBlogPosts()
    .map((p) => ({
      slug: p.slug,
      title: p.metadata.title,
      summary: p.metadata.summary,
      publishedAt: p.metadata.publishedAt,
      image: p.metadata.image,
      minutes: readingMinutes(p.content),
      topic: topicOf(p.slug),
    }))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt) || a.title.localeCompare(b.title));
}

import { formatDate, getBlogPosts } from "@/app/blog/utils";
import Link from "next/link";
import { Button } from "./ui/button";

export function BlogPosts() {
  let allBlogs = getBlogPosts();

  return (
    <div>
      <h2>Blog Posts</h2>
      <div>
        {allBlogs
          .sort((a, b) => {
            if (
              new Date(a.metadata.publishedAt) >
              new Date(b.metadata.publishedAt)
            ) {
              return -1;
            }
            return 1;
          })
          .map((post) => (
            <div
              key={post.slug}
              className="w-full mb-3 flex flex-col md:flex-row justify-between items-start"
            >
              <Button variant="link" asChild className="p-0 h-auto text-base">
                <Link href={`/blog/${post.slug}`}>{post.metadata.title}</Link>
              </Button>
              <p className="text-muted-foreground tabular-nums text-sm md:text-base">
                {formatDate(post.metadata.publishedAt, false)}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

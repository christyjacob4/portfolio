import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostsClient } from "./posts-client";

export function BlogPosts() {
  const allBlogs = getBlogPosts();

  return <BlogPostsClient posts={allBlogs} />;
}

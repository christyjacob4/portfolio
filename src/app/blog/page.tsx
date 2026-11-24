import { PageHeader } from "@/components/page-header";
import { BlogIndex } from "@/components/blog-index";
import { getPostCards } from "@/lib/load-posts";
import { topics } from "@/data/topics";

export const metadata = {
  title: "Writing",
  description:
    "Interactive essays on transformers, attention, quantization, KV caching, mixture of experts, LoRA, RLHF and more.",
};

export default function Page() {
  const posts = getPostCards();
  const used = topics.filter((t) => posts.some((p) => p.topic === t));
  return (
    <>
      <PageHeader
        eyebrow={`Writing · ${posts.length} essays`}
        title={
          <>
            How it <span className="italic text-brand">actually</span> works
          </>
        }
        lede="Long-form, hands-on explanations of modern machine learning systems, with interactive figures you can poke at. Start anywhere."
      />
      <BlogIndex posts={posts} topics={used} />
    </>
  );
}

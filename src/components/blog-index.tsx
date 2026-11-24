"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard, titleParts } from "@/lib/posts";
import { Cover, PostGridCard, PostMeta } from "./post-card";

export function BlogIndex({ posts, topics }: { posts: PostCard[]; topics: string[] }) {
  const [topic, setTopic] = useState<string>("All");
  const [featured, ...others] = posts;
  const visible = topic === "All" ? others : posts.filter((p) => p.topic === topic);
  const parts = titleParts(featured.title);

  return (
    <div>
      {topic === "All" && (
        <Link
          prefetch={false}
          href={`/blog/${featured.slug}`}
          className="group mb-10 grid overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-brand/50 md:grid-cols-[1.25fr_1fr]"
        >
          <Cover post={featured} sizes="(min-width:768px) 620px, 92vw" priority w={1280} />
          <div className="flex flex-col justify-center gap-3 p-6 sm:p-10">
            <p className="eyebrow text-brand">Latest &middot; {featured.topic}</p>
            <h2 className="display text-[clamp(2.2rem,4.5vw,3.6rem)]">{parts.main}</h2>
            {parts.deck && <p className="text-lg font-medium leading-snug">{parts.deck}</p>}
            <p className="line-clamp-3 text-[0.95rem] leading-relaxed text-muted-foreground">{featured.summary}</p>
            <div className="mt-3 flex items-center justify-between">
              <PostMeta post={featured} />
              <ArrowRight className="h-5 w-5 text-brand transition-transform group-hover:translate-x-1" aria-hidden />
            </div>
          </div>
        </Link>
      )}

      <div role="group" aria-label="Filter by topic" className="mb-8 flex flex-wrap gap-2">
        {["All", ...topics].map((t) => {
          const count = t === "All" ? posts.length : posts.filter((p) => p.topic === t).length;
          const on = topic === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {t} <span className={on ? "opacity-70" : "opacity-60"}>{count}</span>
            </button>
          );
        })}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <li key={p.slug}>
            <PostGridCard post={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

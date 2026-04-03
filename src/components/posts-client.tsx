"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "@radix-ui/react-icons";

// Inline formatDate function to avoid importing from utils that uses fs
function formatDate(date: string, includeRelative = false) {
  let currentDate = new Date();
  if (!date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  let targetDate = new Date(date);

  let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  let monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  let daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  let fullDate = targetDate.toLocaleString("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}

type Post = {
  metadata: {
    title: string;
    publishedAt: string;
    summary: string;
    image?: string;
    published?: boolean;
  };
  slug: string;
  content: string;
};

interface BlogPostsClientProps {
  posts: Post[];
}

export function BlogPostsClient({ posts }: BlogPostsClientProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const sortedBlogs = posts.sort((a, b) => {
    const dateA = new Date(a.metadata.publishedAt);
    const dateB = new Date(b.metadata.publishedAt);
    
    if (sortOrder === "newest") {
      return dateB.getTime() - dateA.getTime();
    } else {
      return dateA.getTime() - dateB.getTime();
    }
  });

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="title">Recent Posts</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-[120px] justify-between">
              {sortOrder === "newest" ? "Most Recent" : "Oldest First"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border w-[120px]">
            <DropdownMenuItem onClick={() => setSortOrder("newest")}>
              Most Recent
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
              Oldest First
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {sortedBlogs.map((post) => (
          <Link
            key={post.slug}
            className="group block overflow-hidden rounded-lg transition-opacity duration-200 hover:opacity-80"
            href={`/blog/${post.slug}`}
          >
            {/* Header Image or generated cover */}
            <div className="relative aspect-video overflow-hidden rounded-lg">
              {post.metadata.image ? (
                <Image
                  src={post.metadata.image}
                  alt={`${post.metadata.title} header image`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div
                  className="absolute inset-0 flex flex-col justify-between p-5"
                  style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #141414 50%, #0a0a0a 100%)' }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                  />
                  <span className="relative text-[10px] font-mono text-neutral-600 tracking-[0.2em] uppercase">
                    {formatDate(post.metadata.publishedAt, false)}
                  </span>
                  <p className="relative text-lg font-medium text-neutral-200 leading-snug tracking-tight line-clamp-3" style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}>
                    {post.metadata.title}
                  </p>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className="pt-3">
              <time className="text-xs text-muted-foreground mb-1.5 block tracking-wide">
                {formatDate(post.metadata.publishedAt, false)}
              </time>
              <h3 className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-150 leading-snug">
                {post.metadata.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 
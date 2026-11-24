"use client";

import Link from "next/link";
import Image from "next/image";
import { CoverImage } from "@/components/CoverImage";
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
      <div className="flex items-baseline justify-between mb-6 animate-fade-up delay-75">
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
      
      <div className="grid gap-6 md:grid-cols-2 animate-fade-up delay-150">
        {sortedBlogs.map((post) => (
          <Link
            key={post.slug}
            className="group block overflow-hidden rounded-lg transition-opacity duration-200 hover:opacity-80"
            href={`/blog/${post.slug}`}
          >
            {/* Header Image or generated cover */}
            <div className="relative aspect-video overflow-hidden rounded-lg group/image">
              {post.metadata.image ? (
                <Image
                  src={post.metadata.image}
                  alt={`${post.metadata.title} header image`}
                  fill
                  sizes="(min-width: 768px) 320px, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <CoverImage title={post.slug === 'craft' ? post.metadata.title : undefined} />
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
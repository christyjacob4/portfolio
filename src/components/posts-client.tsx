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
            <Button variant="outline" size="sm">
              Sort by {sortOrder === "newest" ? "Most Recent" : "Oldest"}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-border">
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
            className="group block overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.02]"
            href={`/blog/${post.slug}`}
          >
            {/* Header Image */}
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={post.metadata.image || "/placeholder.svg"}
                alt={`${post.metadata.title} header image`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Card Content */}
            <div className="pt-4">
              <time className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
                {formatDate(post.metadata.publishedAt, false)}
              </time>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                {post.metadata.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 
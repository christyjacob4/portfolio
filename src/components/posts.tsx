import { formatDate, getBlogPosts } from "@/app/blog/utils";
import Link from "next/link";
import { Button } from "./ui/button";

export function BlogPosts() {
  let allBlogs = [
    {
      slug: "public-beta",
      metadata: {
        title: "Appwrite Cloud is now in public beta",
        publishedAt: "2023-05-02",
        summary: "Announcing Appwrite's public beta release as an open-source Firebase alternative."
      },
      link: "https://appwrite.io/blog/post/public-beta"
    },
    {
      slug: "announcing-appwrite-new-ai-integrations",
      metadata: {
        title: "Announcing Appwrite's New AI Integrations",
        publishedAt: "2024-05-14",
        summary: "Introducing Appwrite's new AI integrations for enhanced development capabilities."
      },
      link: "https://appwrite.io/blog/post/announcing-appwrite-new-ai-integrations"
    },
    {
      slug: "a-guide-to-maven-repositories",
      metadata: {
        title: "A Guide to Maven Repositories",
        publishedAt: "2021-07-14",
        summary: "Learn about Maven repositories and how to use them effectively in your Java projects."
      },
      link: "https://dev.to/appwrite/a-guide-to-maven-repositories-1e9o"
    },
    {
      slug: "introducing-password-dictionary-in-appwrite",
      metadata: {
        title: "Introducing Password Dictionary in Appwrite",
        publishedAt: "2023-04-12",
        summary: "Discover Appwrite's new Password Dictionary feature for enhanced security in your applications."
      },
      link: "https://dev.to/appwrite/introducing-password-dictionary-in-appwrite-a-new-layer-of-security-2356"
    },
    {
      slug: "30daysofappwrite-appwrite-database",
      metadata: {
        title: "#30DaysOfAppwrite: Appwrite Database",
        publishedAt: "2021-05-15",
        summary: "Explore Appwrite's database capabilities in this comprehensive guide."
      },
      link: "https://dev.to/appwrite/30daysofappwrite-appwrite-database-22an"
    },
    {
      slug: "announcing-appwrite-0-9",
      metadata: {
        title: "Appwrite: The Open Source Firebase Alternative",
        publishedAt: "2021-07-16",
        summary: "Introducing Appwrite 0.9, a major update to the open-source Firebase alternative."
      },
      link: "https://dev.to/appwrite/announcing-appwrite-0-9-the-open-source-firebase-alternative-53ho"
    },
    {
      slug: "welcome-emails-java-sendgrid-appwrite",
      metadata: {
        title: "Send Welcome Emails with SendGrid, and Appwrite",
        publishedAt: "2022-10-18",
        summary: "Learn how to send welcome emails using Java, SendGrid, and Appwrite in this comprehensive tutorial."
      },
      link: "https://www.twilio.com/en-us/blog/welcome-emails-java-sendgrid-appwrite"
    },
  ];

  return (
    <div>
      <h2 className="title">Blog Posts</h2>
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
                <Link href={post.link} target="_blank" rel="noopener noreferrer">{post.metadata.title}</Link>
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

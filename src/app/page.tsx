import { getBlogPosts } from "@/app/blog/utils";
import Link from "next/link";
import Image from "next/image";
import { ImageGallery } from "@/components/image-gallery";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Star } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import { ScrollReveal } from "@/components/ScrollReveal";

type Project = {
  title: string;
  description: string;
  image?: string;
  coverText?: string;
  projectUrl: string;
  githubUrl?: string;
  techStack: string[];
  stars?: number | null;
};

const projects: Project[] = [
  {
    title: "orionlabs",
    description:
      "A software development studio specializing in AI development, full-stack engineering, and custom software solutions.",
    coverText: "orionlabs",
    projectUrl: "https://orionlabs.work",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
  },
  {
    title: "mcat",
    description:
      "A drop-in cat replacement that understands Parquet, Avro, CSV, JSONL, and streams from remote sources like S3, GCS, and HTTP.",
    coverText: "mcat",
    projectUrl: "https://christyjacob4.github.io/mcat",
    githubUrl: "https://github.com/christyjacob4/mcat",
    techStack: ["Python", "PyArrow", "CLI"],
  },
  {
    title: "pghashlib",
    description:
      "PostgreSQL extension providing fast stable hash functions with support for text, bytea, and integer inputs.",
    coverText: "pghashlib",
    projectUrl: "https://github.com/christyjacob4/pghashlib",
    githubUrl: "https://github.com/christyjacob4/pghashlib",
    techStack: ["C", "Docker", "PostgreSQL"],
  },
  {
    title: "appwrite/appwrite",
    description:
      "Open-source backend-as-a-service platform for building scalable web and mobile applications.",
    image: "/projects/appwrite.png",
    projectUrl: "https://appwrite.io",
    githubUrl: "https://github.com/appwrite/appwrite",
    techStack: ["PHP", "Docker", "Redis", "MySQL"],
  },
  {
    title: "appwrite/mcp",
    description:
      "A Model Context Protocol server for interacting with Appwrite's API via Claude and other LLMs.",
    image: "/projects/appwrite-mcp.png",
    projectUrl: "https://github.com/appwrite/mcp",
    githubUrl: "https://github.com/appwrite/mcp",
    techStack: ["Python", "MCP", "LLM"],
  },
  {
    title: "open-runtimes/executor",
    description:
      "Lightweight HTTP API to create and manage OCI-compliant runtimes with horizontal auto-scaling.",
    coverText: "executor",
    projectUrl: "https://github.com/open-runtimes/executor",
    githubUrl: "https://github.com/open-runtimes/executor",
    techStack: ["PHP", "Swoole", "Docker"],
  },
];

async function fetchStars(githubUrl: string): Promise<number | null> {
  try {
    const repoPath = githubUrl.replace("https://github.com/", "");
    const res = await fetch(`https://api.github.com/repos/${repoPath}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count ?? null;
  } catch {
    return null;
  }
}

function formatDate(date: string) {
  if (!date.includes("T")) date = `${date}T00:00:00`;
  return new Date(date).toLocaleString("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function Page() {
  // Fetch stars for projects with GitHub URLs, sort by stars, take top 4
  const projectsWithStars = (
    await Promise.all(
      projects.map(async (p) => ({
        ...p,
        stars: p.githubUrl ? await fetchStars(p.githubUrl) : null,
      }))
    )
  )
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
    .slice(0, 4);

  // Get 4 most recent blog posts
  const allPosts = getBlogPosts()
    .sort(
      (a, b) =>
        new Date(b.metadata.publishedAt).getTime() -
        new Date(a.metadata.publishedAt).getTime()
    )
    .slice(0, 4);

  return (
    <section>
      {/* Hero */}
      <h1 className="mb-8 text-2xl font-medium tracking-tighter animate-fade-up delay-75">
        hey, i&apos;m christy 👋
      </h1>
      <p className="text-muted-foreground my-8 animate-fade-up delay-150">
        A software engineer and open-source advocate specialized in building
        highly performant distributed systems. Currently at{" "}
        <Link
          href="https://magic.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Magic
        </Link>
        . Previously Head of Engineering at{" "}
        <Link
          href="https://appwrite.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Appwrite
        </Link>
        , an open source developer platform with over{" "}
        <Link
          href="https://github.com/appwrite/appwrite"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          51K stars on GitHub.
        </Link>
      </p>

      <div className="my-8 animate-fade-up delay-225">
        <ImageGallery />
      </div>

      <p className="text-muted-foreground animate-fade-up delay-300">
        At Appwrite I architected scalable cloud systems, drove key
        engineering initiatives and mentored a global community of developers. I
        also have a strong background in AI and Machine Learning, holding a
        Master&apos;s degree in Artificial Intelligence. Previously, I&apos;ve
        worked with leading companies like{" "}
        <Link
          href="https://www.intuit.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Intuit
        </Link>{" "}
        and{" "}
        <Link
          href="https://research.samsung.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Samsung Research
        </Link>
        .
      </p>

      {/* Projects */}
      <ScrollReveal className="my-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="title">Projects</h2>
          <Link
            href="/projects"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {projectsWithStars.map((project) => (
            <Link
              key={project.title}
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col rounded-xl border border-neutral-800/60 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all duration-300 overflow-hidden"
            >
              {/* Cover */}
              <div className="relative aspect-[4/3] overflow-hidden group/image">
                {project.image ? (
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <CoverImage title={project.coverText ?? project.title} />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                {/* Stars badge */}
                {project.stars != null && project.stars > 0 && (
                  <span className="absolute top-2 right-2 text-[10px] text-neutral-300 bg-black/50 backdrop-blur-xs rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    {project.stars > 1000
                      ? `${(project.stars / 1000).toFixed(1)}k`
                      : project.stars}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="p-3 flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors truncate">
                    {project.title}
                  </h3>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-auto pt-1">
                  {project.techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] text-neutral-500 font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>

      {/* Blog */}
      <ScrollReveal className="my-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="title">Recent Posts</h2>
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {allPosts.map((post) => (
            <Link
              key={post.slug}
              className="group block overflow-hidden rounded-lg transition-opacity duration-200 hover:opacity-80"
              href={`/blog/${post.slug}`}
            >
              <div className="relative aspect-video overflow-hidden rounded-lg group/image">
                {post.metadata.image ? (
                  <Image
                    src={post.metadata.image}
                    alt={`${post.metadata.title} header image`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <CoverImage title={post.slug === 'craft' ? post.metadata.title : undefined} />
                )}
              </div>
              <div className="pt-3">
                <time className="text-xs text-muted-foreground mb-1.5 block tracking-wide">
                  {formatDate(post.metadata.publishedAt)}
                </time>
                <h3 className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-150 leading-snug">
                  {post.metadata.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}

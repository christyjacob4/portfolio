"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Github, ArrowUpRight, ExternalLink, Star } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useEffect, useState } from "react";

const projects = [
  {
    title: "remotenomad",
    description:
      "A modern job board platform helping developers find their dream remote positions at top tech companies worldwide.",
    image: "/projects/remotenomad.png",
    projectUrl: "https://remotenomad.app",
    techStack: ["Sveltekit", "Tailwind CSS", "Appwrite"],
  },
  {
    title: "promptsauce",
    description: "A platform for discovering and sharing AI prompts.",
    image: "/projects/promptsauce.png",
    projectUrl: "https://promptsauce.com",
    techStack: ["Next.js", "Tailwind CSS", "Appwrite"],
  },
  {
    title: "appwrite/appwrite",
    description:
      "Appwrite is an open-source backend-as-a-service server that allows you to build scalable, secure, and real-time web and mobile applications.",
    image: "/projects/appwrite.png",
    projectUrl: "https://appwrite.io",
    githubUrl: "https://github.com/appwrite/appwrite",
    techStack: [
      "Python",
      "Node.js",
      "Sveltekit",
      "PHP",
      "Docker",
      "Redis",
      "MySQL",
      "Terraform",
    ],
  },
  {
    title: "appwrite/mcp",
    description:
      "A Model Context Protocol server for interacting with Appwrite's API. Provides tools to manage databases, users, functions, teams, and more within your Appwrite project.",
    image: "/projects/appwrite-mcp.png",
    projectUrl: "https://github.com/appwrite/mcp",
    githubUrl: "https://github.com/appwrite/mcp",
    techStack: ["Python", "MCP", "Claude", "Appwrite", "LLM"],
  },
  {
    title: "appwrite/monitoring",
    description:
      "A lightweight system monitoring tool that tracks CPU, memory, and disk usage across infrastructure. It creates incidents in BetterStack when resource usage exceeds defined thresholds, with configurable parameters for monitoring sensitivity.",
    coverText: "monitoring",
    projectUrl: "https://github.com/appwrite/monitoring",
    githubUrl: "https://github.com/appwrite/monitoring",
    techStack: ["Go", "Docker", "BetterStack", "DevOps"],
  },
  {
    title: "open-runtimes/executor",
    description:
      "Executor provides a lightweight and highly performant HTTP API to create and manage OCI complaint runtimes (Docker). Executor manages the runtime's state and ensures jobs are scheduled to the right containers while handles horizontal auto-scaling and minimizing cold starts.",
    coverText: "executor",
    projectUrl: "https://github.com/open-runtimes/executor",
    githubUrl: "https://github.com/open-runtimes/executor",
    techStack: ["PHP", "Swoole", "Docker"],
  },
];

// Hook to fetch GitHub stars
function useGitHubStars(githubUrl: string | undefined) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (!githubUrl) return;

    const repoPath = githubUrl.replace("https://github.com/", "");

    fetch(`https://api.github.com/repos/${repoPath}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        // Silently fail if API request fails
      });
  }, [githubUrl]);

  return stars;
}

function ProjectItem({ project }: { project: (typeof projects)[0] }) {
  const stars = useGitHubStars(project.githubUrl);

  return (
    <HoverCard openDelay={10} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div className="group flex items-center justify-between py-2 rounded-md transition-colors cursor-pointer">
          <div className="flex items-center gap-1">
            <ArrowUpRight className="h-5 w-5" />
            <Link
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h3 className="font-medium text-base relative group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                {project.title}
                <span className="absolute left-0 -bottom-0.5 w-full h-[1px] bg-current transform scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100"></span>
              </h3>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <Link
                href={project.githubUrl}
                className="flex items-center hover:text-neutral-800 dark:hover:text-neutral-500 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {stars && (
                  <span className="text-xs flex items-center gap-1">
                    {stars > 1000 ? `${(stars / 1000).toFixed(1)}k` : stars}
                    <Star className="h-4 w-4 fill-current" />
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 md:w-[400px] border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 !p-0 overflow-hidden"
        side="bottom"
        align="end"
        sideOffset={0}
      >
        <div>
          <div className="aspect-video relative bg-neutral-100 dark:bg-neutral-800">
            {project.image ? (
              <Image
                src={project.image}
                alt={project.title}
                fill={true}
                style={{ objectFit: "cover", objectPosition: "top" }}
                className=""
              />
            ) : (
              <CoverImage title={project.coverText ?? project.title} />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{project.title}</h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {project.techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Projects</h1>
      <div className="space-y-0">
        {projects.map((project, index) => (
          <ProjectItem key={index} project={project} />
        ))}
      </div>
    </section>
  );
}

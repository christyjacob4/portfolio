import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Github, ArrowUpRight } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";

const projects = [
  {
    title: "RemoteNomad",
    description:
      "A modern job board platform helping developers find their dream remote positions at top tech companies worldwide.",
    image: "/projects/remotenomad.png",
    projectUrl: "https://remotenomad.app",
    techStack: ["Sveltekit", "Tailwind CSS", "Appwrite"],
  },
  {
    title: "PromptSauce",
    description:
      "A platform for discovering and sharing AI prompts.",
    image: "/projects/promptsauce.png",
    projectUrl: "https://promptsauce.com",
    techStack: ["Next.js", "Tailwind CSS", "Appwrite"],
  },
  {
    title: "Appwrite",
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
    techStack: ["PHP", "Swoole","Docker"],
  },
];

export const metadata = {
  title: "Projects",
  description: "Some of the coolest projects I've worked on.",
};

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Projects</h1>
      <div className="grid grid-cols-1 gap-8">
        {projects.map((project, index) => (
          <div
            key={index}
            className="relative group/image border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
          >
            <div className="aspect-video relative overflow-hidden h-64 sm:h-90 w-full">
              {project.image ? (
                <Image
                  src={project.image}
                  alt={project.title}
                  fill={true}
                  style={{ objectFit: "cover", objectPosition: "top" }}
                  className="transition-transform duration-300 group-hover/image:scale-105 w-full"
                />
              ) : (
                <CoverImage title={project.coverText ?? project.title} />
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Link
                  href={project.projectUrl}
                  className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100 group/link"
                  target="_blank"
                >
                  {/* <ArrowUpRight className="h-5 w-5 mr-1" /> */}
                  <h2 className="text-xl font-medium relative">
                    {project.title}
                    <span className="absolute left-0 -bottom-0.5 w-full h-[1px] bg-current transform scale-x-0 transition-transform duration-200 origin-left group-hover/link:scale-x-100"></span>
                  </h2>
                </Link>
                {project.githubUrl && (
                  <Link
                    href={project.githubUrl}
                    className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="h-4 w-4" />
                    <span>source</span>
                  </Link>
                )}
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

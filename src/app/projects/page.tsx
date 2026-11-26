import { ProjectItem, Project } from "@/components/ProjectItem";

const projects: Project[] = [
  {
    title: "eyezen",
    description:
      "A menu bar app for macOS that reminds you to look away from the screen, walks you through short guided eye exercises, and shows where your focus time went. Free, with no account, and everything stays on your Mac.",
    image: "/projects/eyezen.png",
    projectUrl: "https://eyezen.dev",
    githubUrl: "https://github.com/christyjacob4/eyezen",
    techStack: ["Swift", "SwiftUI", "SwiftData", "macOS"],
  },
  {
    title: "orionlabs",
    description:
      "A software development studio specializing in AI development, full-stack engineering, and custom software solutions. Built for clients ranging from seed-stage startups to Fortune 500 enterprises.",
    image: "/projects/orionlabs.png",
    projectUrl: "https://orionlabs.work",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Cloudflare Pages"],
  },
  {
    title: "mcat",
    description:
      "A drop-in cat replacement that understands Parquet, Avro, CSV, JSONL, and streams from remote sources like S3, GCS, and HTTP. Includes schema inspection, column selection, grep, sort, stats, and diff.",
    coverText: "mcat",
    projectUrl: "https://christyjacob4.github.io/mcat",
    githubUrl: "https://github.com/christyjacob4/mcat",
    techStack: ["Python", "PyArrow", "fsspec", "CLI"],
  },
  {
    title: "pghashlib",
    description: "PostgreSQL extension providing fast stable hash functions with support for text, bytea, and integer inputs.",
    coverText: "pghashlib",
    projectUrl: "https://github.com/christyjacob4/pghashlib",
    githubUrl: "https://github.com/christyjacob4/pghashlib",
    techStack: ["C", "Docker", "PostgreSQL"],
  },
  {
    title: "remotenomad",
    description:
      "A remote-only job board with listings pulled straight from company careers pages, checked every few hours so closed roles drop off. Includes an employer portal with paid listings.",
    image: "/projects/remotenomad.png",
    projectUrl: "https://www.remotenomad.app",
    techStack: ["Next.js", "Appwrite", "Cloudflare", "Dodo Payments"],
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

async function addStarCounts(projects: Project[]): Promise<Project[]> {
  return Promise.all(
    projects.map(async (project) => {
      if (!project.githubUrl) {
        return { ...project, stars: null } as Project;
      }

      const repoPath = project.githubUrl.replace("https://github.com/", "");

      try {
        const res = await fetch(`https://api.github.com/repos/${repoPath}`, {
          headers: {
            Accept: "application/vnd.github+json",
          },
          next: { revalidate: 86400 }, // revalidate every 24h
        });

        if (!res.ok) {
          return { ...project, stars: null } as Project;
        }

        const data = await res.json();
        return { ...project, stars: data.stargazers_count ?? null } as Project;
      } catch {
        return { ...project, stars: null } as Project;
      }
    })
  );
}

export default async function Page() {
  const projectsWithStars = await addStarCounts(projects);

  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter animate-fade-up delay-75">Projects</h1>
      <div className="space-y-0 animate-fade-up delay-150">
        {projectsWithStars.map((project, index) => (
          <ProjectItem key={index} project={project} />
        ))}
      </div>
    </section>
  );
}

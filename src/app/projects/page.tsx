import { ProjectItem, Project } from "@/components/ProjectItem";

const projects: Project[] = [
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
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Projects</h1>
      <div className="space-y-0">
        {projectsWithStars.map((project, index) => (
          <ProjectItem key={index} project={project} />
        ))}
      </div>
    </section>
  );
}

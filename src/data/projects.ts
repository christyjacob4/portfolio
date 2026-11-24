import type { Project } from "@/components/ProjectItem";

export const projects: Project[] = [
  {
    title: "orionlabs",
    description:
      "A software development studio specializing in AI development, full-stack engineering, and custom software solutions. Built for clients ranging from seed-stage startups to Fortune 500 enterprises.",
    coverText: "orionlabs",
    projectUrl: "https://orionlabs.work",
    techStack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
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

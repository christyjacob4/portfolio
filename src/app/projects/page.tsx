import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Github } from "lucide-react";

const projects = [
  {
    title: "RemoteNomad",
    description:
      "A modern job board platform helping developers find their dream remote positions at top tech companies worldwide.",
    image: "/projects/remotenomad.png",
    projectUrl: "https://remotenomad.app",
    techStack: [
      "Sveltekit",
      "Tailwind CSS",
      "Appwrite"
    ],
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
      "Terraform"
    ],
  }
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
          <div key={index} className="relative group">
            <Link
              href={project.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden transition-all hover:border-neutral-400 dark:hover:border-neutral-600"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={1200}
                  height={630}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium">{project.title}</h2>
                  {project.githubUrl && (
                    <Link
                      href={project.githubUrl}
                      className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors relative z-10"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      <span>Source</span>
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
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

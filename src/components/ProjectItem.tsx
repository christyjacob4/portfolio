'use client';

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Star } from "lucide-react";
import { CoverImage } from "@/components/CoverImage";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export type Project = {
  title: string;
  description: string;
  image?: string;
  coverText?: string;
  projectUrl: string;
  githubUrl?: string;
  techStack: string[];
  stars?: number | null;
};

export function ProjectItem({ project }: { project: Project }) {
  return (
    <HoverCard openDelay={10} closeDelay={0}>
      <div className="flex items-center justify-between py-2">
        <HoverCardTrigger asChild>
          <div className="group flex items-center gap-1 rounded-md transition-colors cursor-pointer">
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
        </HoverCardTrigger>
        <div className="flex items-center gap-2">
          {project.githubUrl && project.stars !== undefined && project.stars !== null && (
            <Link
              href={project.githubUrl}
              className="flex items-center hover:text-neutral-800 dark:hover:text-neutral-500 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs flex items-center gap-1">
                {project.stars > 1000 ? `${(project.stars / 1000).toFixed(1)}k` : project.stars}
                <Star className="h-4 w-4 fill-current" />
              </span>
            </Link>
          )}
        </div>
      </div>
      <HoverCardContent
        className="w-80 md:w-[400px] border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 !p-0 overflow-hidden"
        side="right"
        align="start"
        sideOffset={8}
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
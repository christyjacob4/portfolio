import Image from "next/image";
import type { Project } from "@/components/ProjectItem";

/** Image cover when available, else a typographic monogram tile. */
export function ProjectCover({ project, sizes }: { project: Project; sizes: string }) {
  if (project.image) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Image src={project.image} alt="" fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  const name = (project.coverText ?? project.title).split("/").pop() as string;
  return (
    <div
      className="relative grid aspect-[16/10] place-items-center overflow-hidden bg-brand-soft"
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--brand)/0.12) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--brand)/0.12) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <span className="display relative text-4xl text-brand sm:text-5xl">{name}</span>
    </div>
  );
}

import { ArrowUpRight, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProjectCover } from "@/components/project-cover";
import { projects } from "@/data/projects";
import { fetchStars, formatStars } from "@/lib/stars";

export default async function Page() {
  const withStars = await Promise.all(
    projects.map(async (p) => ({ ...p, stars: await fetchStars(p.githubUrl) })),
  );
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title={
          <>
            Things I&apos;ve <span className="italic text-brand">shipped</span>
          </>
        }
        lede="Open-source tools, infrastructure and a few side projects. The Appwrite repositories are open-source work from my time there."
      />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {withStars.map((p) => (
          <li key={p.title}>
            <a
              href={p.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-brand/50"
            >
              <ProjectCover project={p} sizes="(min-width:1024px) 360px, (min-width:640px) 45vw, 92vw" />
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-lg font-semibold">{p.title}</h2>
                  <span className="inline-flex shrink-0 items-center gap-2 font-mono text-xs text-muted-foreground">
                    {p.stars ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3" aria-hidden /> {formatStars(p.stars)}
                      </span>
                    ) : null}
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                <ul className="mt-auto flex flex-wrap gap-1.5 pt-1" aria-label="Tech stack">
                  {p.techStack.map((t) => (
                    <li key={t} className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[0.68rem] text-muted-foreground">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

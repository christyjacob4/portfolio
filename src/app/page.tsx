import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowRight, Star } from "lucide-react";
import { getPostCards } from "@/lib/load-posts";
import { Cover, PostMeta } from "@/components/post-card";
import { AttentionMark } from "@/components/attention-mark";
import { ProjectCover } from "@/components/project-cover";
import { coverVariant, formatPostDate, titleParts } from "@/lib/posts";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { fetchStars, formatStars } from "@/lib/stars";

const elsewhere = [
  { href: "https://github.com/christyjacob4", text: "GitHub" },
  { href: "https://x.com/christyjacob4", text: "X" },
  { href: "https://www.linkedin.com/in/christyjacob4/", text: "LinkedIn" },
  { href: "mailto:christyjacob4@gmail.com", text: "Email" },
];

export default async function Page() {
  const posts = getPostCards();
  const [featured, ...rest] = posts;
  const featuredParts = titleParts(featured.title);

  const picks = await Promise.all(
    ["appwrite/appwrite", "mcat", "open-runtimes/executor"].map(async (t) => {
      const p = projects.find((x) => x.title === t)!;
      return { ...p, stars: await fetchStars(p.githubUrl) };
    }),
  );

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="grid items-end gap-10 pb-12 pt-12 sm:pt-20 lg:grid-cols-[1fr_auto] lg:pb-16">
        <div>
          <p className="eyebrow rise">Engineer &middot; Writer</p>
          <h1
            className="display rise mt-5 text-[clamp(3.6rem,11vw,8.25rem)]"
            style={{ ["--i" as string]: 1 }}
          >
            Christy <span className="italic text-brand">Jacob</span>
          </h1>
          <p
            className="rise mt-7 max-w-xl text-lg leading-relaxed text-foreground/80 sm:text-xl"
            style={{ ["--i" as string]: 2 }}
          >
            Currently at{" "}
            <a href="https://magic.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground link-u">
              Magic
            </a>
            . Previously Head of Engineering at{" "}
            <a href="https://appwrite.io" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground link-u">
              Appwrite
            </a>
            . I write interactive essays on how modern ML systems actually work.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ ["--i" as string]: 3 }}>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Read the writing <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              Work history
            </Link>
          </div>
        </div>
        <AttentionMark className="rise hidden h-56 w-56 shrink-0 lg:block xl:h-72 xl:w-72" />
      </section>

      {/* Bento */}
      <section aria-label="Overview" className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Featured post */}
        <Link
          prefetch={false}
          href={`/blog/${featured.slug}`}
          className="tile group overflow-hidden !p-0 lg:col-span-7 lg:row-span-2 flex flex-col"
        >
          <Cover post={featured} sizes="(min-width:1024px) 640px, 92vw" priority w={1280} />
          <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
            <p className="eyebrow text-brand">Latest &middot; {featured.topic}</p>
            <h2 className="display text-[clamp(2.2rem,5vw,3.4rem)]">{featuredParts.main}</h2>
            {featuredParts.deck && (
              <p className="text-lg font-medium leading-snug text-foreground/85">{featuredParts.deck}</p>
            )}
            <p className="max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground line-clamp-3">
              {featured.summary}
            </p>
            <div className="mt-auto flex items-center justify-between pt-4">
              <PostMeta post={featured} />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                Read <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </div>
          </div>
        </Link>

        {/* Writing list */}
        <div className="tile lg:col-span-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="display text-3xl">Writing</h2>
            <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              All {posts.length} posts &rarr;
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {rest.slice(0, 4).map((p) => {
              const t = titleParts(p.title);
              const thumb = coverVariant(p.image, 720);
              return (
                <li key={p.slug}>
                  <Link prefetch={false}
          href={`/blog/${p.slug}`} className="group flex items-center gap-4 py-3">
                    <div className="relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted">
                      {thumb && <Image src={thumb} alt="" fill sizes="72px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-snug group-hover:text-brand transition-colors">{t.main}</p>
                      <p className="truncate font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                        {formatPostDate(p.publishedAt, { short: true })} &middot; {p.minutes} min
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Now / experience */}
        <div className="tile lg:col-span-5">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="display text-3xl">Experience</h2>
            <Link href="/work" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Full history &rarr;
            </Link>
          </div>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {experience.slice(0, 4).map((e, i) => (
              <li key={e.company} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card ${
                    i === 0 ? "bg-brand ring-4 ring-brand/20" : "bg-muted-foreground/50"
                  }`}
                />
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-white ring-1 ring-border">
                    <Image src={e.icon} alt="" fill sizes="32px" className="object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-tight">
                      {e.positions[0].title}{" "}
                      <span className="font-normal text-muted-foreground">&middot; {e.company}</span>
                    </p>
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                      {e.summaryPeriod}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Projects */}
        <div className="tile lg:col-span-8">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="display text-3xl">Selected projects</h2>
            <Link href="/projects" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              All projects &rarr;
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3">
            {picks.map((p) => (
              <li key={p.title}>
                <a
                  href={p.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-xl border border-border transition-colors hover:border-brand/50"
                >
                  <ProjectCover project={p} sizes="(min-width:1024px) 200px, 92vw" />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-medium">{p.title}</h3>
                      {p.stars ? (
                        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Star className="h-3 w-3" aria-hidden /> {formatStars(p.stars)}
                        </span>
                      ) : (
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[0.82rem] leading-relaxed text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Talks + links */}
        <div className="tile flex flex-col lg:col-span-4">
          <h2 className="display text-3xl">Talks</h2>
          <p className="mt-2 text-sm text-muted-foreground">Nothing recorded yet. Coming soon.</p>
          <div className="my-5 h-px bg-border" />
          <h2 className="display text-3xl">Elsewhere</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4">
            {elsewhere.map((l) => (
              <li key={l.text}>
                <a
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between border-b border-border/70 py-2.5 text-sm"
                >
                  <span className="link-u">{l.text}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

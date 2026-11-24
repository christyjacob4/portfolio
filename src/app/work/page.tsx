import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PageHeader } from "@/components/page-header";
import { experience } from "@/data/experience";

export const metadata = {
  title: "Work",
  description: "Where I've worked, from computer vision research to engineering leadership to ML infrastructure at Magic.",
};

const mdxComponents = {
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  a: (props) => <a className="text-brand underline underline-offset-2" {...props} />,
};

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Work"
        title={
          <>
            Where I&apos;ve <span className="italic text-brand">built</span>
          </>
        }
        lede={
          <>
            From computer vision research, to leading engineering at an open source developer platform running{" "}
            <strong className="font-medium text-foreground">100M+ daily requests</strong>, to ML at{" "}
            <a href="https://magic.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground link-u">
              Magic
            </a>
            .
          </>
        }
      />

      <ol className="space-y-5">
        {experience.map((company) => (
          <li key={company.company} className="tile !p-0 overflow-hidden">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[16rem_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-border">
                    <Image src={company.icon} alt={`${company.company} logo`} fill sizes="48px" className="object-contain" />
                  </div>
                  <div>
                    <h2 className="display text-3xl leading-none">
                      <a
                        href={company.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-brand"
                      >
                        {company.company}
                      </a>
                    </h2>
                    {company.location && (
                      <p className="mt-1 text-sm text-muted-foreground">{company.location}</p>
                    )}
                  </div>
                </div>
                <p className="mt-4 font-mono text-[0.72rem] uppercase tracking-[0.1em] text-muted-foreground">
                  {company.summaryPeriod}
                </p>
                {company.current && (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden /> Current
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {company.positions.map((position) => (
                  <div key={position.title + position.period}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <h3 className="text-lg font-semibold">{position.title}</h3>
                      <p className="font-mono text-xs tabular-nums text-muted-foreground">{position.period}</p>
                    </div>
                    {position.achievements.length > 0 && (
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-[0.95rem] leading-relaxed text-foreground/80 marker:text-brand">
                        {position.achievements.map((a, i) => (
                          <li key={i} className="pl-1 [&_p]:m-0">
                            <MDXRemote source={a} components={mdxComponents} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

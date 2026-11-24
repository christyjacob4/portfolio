import { experience as workExperiences } from "@/data/experience";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Work",
  description: "My work experience and professional journey.",
};

// Define custom styles for MDX content
const mdxComponents = {
  strong: (props) => <strong className="text-white font-medium" {...props} />,
};



export default function Page() {
  return (
    <section className="max-w-2xl mb-8">
      <h1 className="font-medium text-2xl mb-8 tracking-tighter animate-fade-up delay-75">Work</h1>
      <p className="text-base text-muted-foreground mb-8 animate-fade-up delay-150">
        Over the past 5 years, I&apos;ve evolved from a researcher developing
        cutting-edge computer vision systems to leading engineering
        organizations at scale. I&apos;ve architected cloud infrastructures
        handling <strong className="text-foreground font-medium">over 100M daily requests</strong>, pioneered AI
        initiatives, and built cross-platform applications that dramatically
        improved business outcomes. My expertise spans full-stack development,
        deep learning, and distributed systems, with contributions that have
        directly influenced <strong className="text-foreground font-medium">$37M+ in funding</strong>. Whether leading
        world-class engineering teams or providing technical consulting to
        founders & C-suite executives, I consistently deliver solutions that
        combine technical excellence with strategic business value.
      </p>

      <div className="space-y-14 animate-fade-up delay-225">
        {workExperiences.map((company, index) => (
          <div key={index} className="group">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative h-14 md:h-12 aspect-square rounded-md overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={company.icon}
                  alt={`${company.company} logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-medium text-xl">
                  <a
                    href={company.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {company.company}
                  </a>
                </h3>
                {company.location && (
                  <p className="text-sm text-muted-foreground">
                    {company.location}
                  </p>
                )}
              </div>
            </div>

            {/* Positions using accordion without timeline */}
            <div className="mb-12">
              <Accordion type="single" collapsible className="space-y-1">
                {company.positions.map((position, posIndex) => (
                  <AccordionItem
                    key={posIndex}
                    value={`item-${posIndex}`}
                    className="border-none"
                  >
                    <AccordionTrigger className="py-1 hover:no-underline">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <h4 className="font-semibold text-lg text-muted-foreground min-w-0 text-left text-balance">
                          {position.title}
                        </h4>
                        <span className="text-sm text-muted-foreground tabular-nums mr-2 shrink-0 whitespace-nowrap">
                          {position.period}
                        </span>
                      </div>
                    </AccordionTrigger>

                    {position.achievements.length > 0 && (
                    <AccordionContent>
                      <div className="pt-2">
                        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                          {position.achievements.map((achievement, i) => (
                            <li key={i} className="text-base pl-1">
                              <MDXRemote
                                source={achievement}
                                components={mdxComponents}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                    )}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Tech Stack section - now at the end */}
            {/* {company.techStack && (
              <div className="ml-2 pl-1 mb-4">
                <h5 className="text-sm font-medium mb-2">Tech Stack</h5>
                <div className="flex flex-wrap gap-2">
                  {company.techStack.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        ))}
      </div>
    </section>
  );
}

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { experience } from "@/data/experience";

export default function Experience() {
  return (
    <div>
      <h2 className="title">Work Experience</h2>
      <div>
        {experience.map((exp) => (
          <div
            key={exp.company}
            className="w-full flex gap-4 mb-6 justify-between items-center"
          >
            <div className="relative h-14 md:h-12 aspect-square rounded-md overflow-hidden bg-muted">
              <Image
                src={exp.icon}
                alt={`${exp.company} logo`}
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between flex-1 min-w-0">
              <div className="flex flex-col">
                <h3 className="font-medium">{exp.positions[0].title}</h3>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {exp.company}
                  </Link>
                </p>
              </div>

              <p className="text-muted-foreground text-sm tabular-nums mt-1 md:mt-0">
                {exp.summaryPeriod}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

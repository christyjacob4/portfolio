import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Separator } from "./ui/separator";

const experiences = [
  {
    title: "Founding Engineer & Lead",
    company: "Appwrite",
    companyUrl: "https://appwrite.io",
    date: "Oct 2019 - Present",
    description: [
      "Lead key engineering initiatives like Appwrite Cloud, CLI, and Cloud Functions",
      "Responsible for architectural reviews of RFCs and design of scalable Cloud systems",
      "Lead open source initiatives and mentorship for contributors across 100+ repositories",
    ],
    icon: "/companies/appwrite.png",
  },
  {
    title: "Technical Advisor",
    company: "Alphasights",
    companyUrl: "https://www.alphasights.com/",
    date: "Jan 2023 - Present",
    description: [
      "Developed features for Mint, Intuit's personal finance app",
      "Built iOS and Android apps for the Intuit Expert Platform",
      "Developed fault-tolerant and scalable APIs using SpringBoot and Kafka",
    ],
    icon: "/companies/intuit.png",
  },
  {
    title: "Software Engineer",
    company: "Intuit",
    companyUrl: "https://www.intuit.com",
    date: "Jan 2020 - May 2021",
    description: [
      "Developed features for Mint, Intuit's personal finance app",
      "Built iOS and Android apps for the Intuit Expert Platform",
      "Developed fault-tolerant and scalable APIs using SpringBoot and Kafka",
    ],
    icon: "/companies/intuit.png",
  },
  {
    title: "Research Engineer",
    company: "Samsung Research",
    companyUrl: "https://research.samsung.com",
    date: "May 2019 - Jul 2019",
    description: [
      "Developed a system for denoising images in ultra-low light environments",
      "Built a CLI tool to improve developer productivity",
    ],
    icon: "/companies/samsung.png",
  },
  {
    title: "Research Intern",
    company: "Marsview.ai",
    companyUrl: "https://eltropy.com/press/eltropy-acquires-marsview-ai",
    date: "Jul 2017 - Aug 2018",
    description: [
      "Developed a system for denoising images in ultra-low light environments",
      "Built a CLI tool to improve developer productivity",
    ],
    icon: "/companies/marsview.png",
  },
];

export default function Experience() {
  return (
    <div>
      <h3>Work Experience</h3>
      {/* <Separator className="mb-4"/> */}
      <div>
        {experiences.map((exp, index) => (
          <div
            key={index}
            className="w-full flex flex-col items-start justify-between gap-1 md:flex-row md:items-center md:space-x-2 mb-4"
          >
            <div className="flex flex-col items-start justify-center flex-1">
              <h4>{exp.title}</h4>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                <Link
                  href={exp.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {exp.company}
                </Link>
              </p>
            </div>

            <p className="text-muted-foreground text-sm tabular-nums md:text-base">
              {exp.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

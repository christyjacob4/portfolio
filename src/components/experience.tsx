import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Separator } from "./ui/separator";

const experiences = [
  {
    title: "Head of Engineering",
    company: "Appwrite",
    companyUrl: "https://appwrite.io",
    date: "Nov. 2021 - Present",
    description: [
      "Lead key engineering initiatives like Appwrite Cloud, CLI, and Cloud Functions",
      "Responsible for architectural reviews of RFCs and design of scalable Cloud systems",
      "Lead open source initiatives and mentorship for contributors across 100+ repositories",
    ],
    icon: "/companies/appwrite.jpg",
  },
  {
    title: "Technical Advisor",
    company: "Alphasights",
    companyUrl: "https://www.alphasights.com/",
    date: "Jan. 2023 - Present",
    description: [
      "Provide strategic technical consultations to C-suite executives and venture capital firms",
      "Conduct comprehensive technical due diligence and architecture evaluations",
      "Deliver expert assessments on bleeding-edge technology trends",
    ],
    icon: "/companies/alphasights.jpg",
  },
  {
    title: "Software Engineer",
    company: "Intuit",
    companyUrl: "https://www.intuit.com",
    date: "Aug. 2020 - May 2021",
    description: [
      "Developed features for Mint, Intuit's personal finance app",
      "Built iOS and Android apps for the Intuit Expert Platform",
      "Developed fault-tolerant and scalable APIs using SpringBoot and Kafka",
    ],
    icon: "/companies/intuit.png",
  },
  {
    title: "Research Intern",
    company: "Samsung Research",
    companyUrl: "https://research.samsung.com",
    date: "May 2019 - Jul. 2019",
    description: [
      "Developed a system for denoising images in ultra-low light environments",
      "Built a CLI tool to improve developer productivity",
    ],
    icon: "/companies/samsung.jpg",
  },
  {
    title: "Founding Research Engineer",
    company: "Marsview.ai",
    companyUrl: "https://eltropy.com/press/eltropy-acquires-marsview-ai",
    date: "Jul. 2017 - Aug. 2018",
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
      <h2 className="title">Work Experience</h2>
      <div>
        {experiences.map((exp, index) => (
          <div
            key={index}
            className="w-full flex gap-4 mb-6 justify-between items-center"
          >
            <div className="relative h-14 md:h-12 aspect-square rounded-md overflow-hidden bg-muted">
              <Image
                src={exp.icon}
                alt={`${exp.company} logo`}
                fill
                className="object-contain"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between flex-1 min-w-0">
              <div className="flex flex-col">
                <h3 className="font-medium">
                  {exp.title}
                </h3>
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
                {exp.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

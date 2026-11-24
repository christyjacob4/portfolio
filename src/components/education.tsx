import React from "react";
import { Separator } from "./ui/separator";
import Link from "next/link";
import Image from "next/image";

const education = [
  {
    degree: "Master's in AI & Machine Learning",
    school: "Birla Institute of Technology and Science",
    schoolUrl: "https://www.bits-pilani.ac.in/",
    location: "India",
    date: "Apr. 2023 - Mar. 2025",
    achievements: [
      "Rank #1/900 - Gold Medalist with a 9.96/10.0 GPA",
      "Recipient of Dr. CNR Rao and Dr. MRD Merit scholarships",
    ],
    icon: "/education/bits_pilani.jpeg",
  },
  {
    degree: "Bachelor's in Computer Science",
    school: "PES University",
    schoolUrl: "https://pes.edu/",
    location: "Bangalore, India",
    date: "Aug. 2016 - Jul. 2020",
    achievements: [
      "Rank #1/900 - Gold Medalist with a 9.96/10.0 GPA",
      "Recipient of Dr. CNR Rao and Dr. MRD Merit scholarships",
    ],
    icon: "/education/pes.jpg",
  }
];

export default function Education() {
  return (
    <div>
      <h2 className="title">Education</h2>
      {/* <Separator className="mb-4"/> */}
      <div>
        {education.map((edu, index) => (
          <div
            key={index}
            className="w-full flex gap-4 mb-6 justify-between items-center"
          >
            <div className="relative h-14 md:h-12 aspect-square rounded-md overflow-hidden bg-muted">
              <Image
                src={edu.icon}
                alt={`${edu.school} logo`}
                fill
                sizes="56px"
                className="object-contain"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between flex-1 min-w-0">
              <div className="flex flex-col">
                <h3 className="font-medium">
                  {edu.degree}
                </h3>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={edu.schoolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {edu.school}
                  </Link>
                </p>
              </div>

              <p className="text-muted-foreground text-sm tabular-nums mt-1 md:mt-0">
                {edu.date}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

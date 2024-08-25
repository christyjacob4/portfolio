import React from "react";
import { Separator } from "./ui/separator";
import Link from "next/link";

const education = [
  {
    degree: "Master's Degree in AI & Machine Learning",
    school: "Birla Institute of Technology and Science",
    schoolUrl: "https://www.bits-pilani.ac.in/",
    location: "India",
    date: "Apr 2023 - Dec 2024",
    achievements: [
      "Rank #1/900 - Gold Medalist with a 9.96/10.0 GPA",
      "Recipient of Dr. CNR Rao and Dr. MRD Merit scholarships",
    ],
  },
  {
    degree: "Bachelor's Degree in Computer Science",
    school: "PES University",
    schoolUrl: "https://pes.edu/",
    location: "Bangalore, India",
    date: "Aug 2016 - Jul 2020",
    achievements: [
      "Rank #1/900 - Gold Medalist with a 9.96/10.0 GPA",
      "Recipient of Dr. CNR Rao and Dr. MRD Merit scholarships",
    ],
  },
  {
    degree: "High School",
    school: "AECS Magnolia",
    schoolUrl:
      "https://www.aecsgroup.co.in/aecs-magnolia-maaruti-public-school/",
    location: "Bangalore, India",
    date: "May 2014 - Apr 2016",
    achievements: [
      "Topper of the graduating class with an aggregate of 95.4% in AISSCE 2016",
    ],
  },
];

export default function Education() {
  return (
    <div>
      <h3>Education</h3>
      {/* <Separator className="mb-4"/> */}
      <div>
        {education.map((edu, index) => (
          <div
            key={index}
            className="w-full flex flex-col items-start justify-between gap-1 md:flex-row md:items-center md:space-x-2 mb-4"
          >
            <div className="flex flex-col items-start justify-center flex-1">
              <h4>{edu.degree}</h4>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                <Link
                  href={edu.schoolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {edu.school}
                </Link>
              </p>
            </div>

            <p className="text-sm text-muted-foreground tabular-nums md:text-base">
              {edu.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

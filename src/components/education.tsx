import React from "react";
import { Separator } from "./ui/separator";

const education = [
  {
    degree: "Master's Degree in AI & Machine Learning",
    school: "Birla Institute of Technology and Science",
    location: "India",
    date: "Apr 2023 - Present",
    achievements: [
      "Rank #1/900 - Gold Medalist with a 9.96/10.0 GPA",
      "Recipient of Dr. CNR Rao and Dr. MRD Merit scholarships",
    ],
  },
  {
    degree: "Bachelor's Degree in Computer Science",
    school: "PES University",
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
            className="w-full flex flex-col md:flex-row items-center justify-between space-x-0 md:space-x-2 mb-4"
          >
            <div className="flex flex-col items-start justify-center">
              <h4>{edu.degree}</h4>
              <p className="text-sm text-muted-foreground font-medium">{edu.school}</p>
            </div>

            <p className="text-sm text-muted-foreground tabular-nums">
              {edu.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

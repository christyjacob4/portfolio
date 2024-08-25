import React from "react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

const skills = [
  "TypeScript",
  "Python",
  "PHP",
  "JavaScript",
  "Java",
  "React",
  "Next.js",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "Redis",
  "RESTful APIs",
  "GraphQL",
  "Machine Learning",
  "Tensorflow",
  "PyTorch",
];

export default function TechStack() {
  return (
    <div>
      <h3>Tech Stack</h3>
      {/* <Separator className="mb-4"/> */}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}

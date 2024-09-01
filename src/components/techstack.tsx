import React from "react";
import { Badge } from "./ui/badge";

const skills = [
  "TypeScript",
  "Python",
  "PHP",
  "JavaScript",
  "Java",
  "Svelte",
  "React",
  "Next.js",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "Redis",
  "RESTful APIs",
  "Tensorflow",
  "PyTorch",
  "OpenAI",
  "LangChain",
  "Machine Learning"
];

export default function TechStack() {
  return (
    <div>
      <h2 className="title">Tech Stack</h2>
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

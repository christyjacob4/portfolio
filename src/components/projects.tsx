import React from "react";
import Link from "next/link";

const projects = [
  {
    title: "DaVinci",
    description: "NFT project for AI-generated art",
    achievements: [
      "Built front-end and Solidity smart contracts",
      "Sold out with 112 ETH trade volume",
    ],
    link: "#",
  },
  {
    title: "Polygen",
    description: "Web3 token discovery app",
    achievements: ["Built front-end", "Backed by Polygon Foundation"],
    link: "#",
  },
  {
    title: "Handwritten Text Extraction",
    description: "System for detecting and recognizing handwritten text",
    achievements: [
      "Developed for automatic digitization of scanned documents and forms",
    ],
    link: "#",
  },
  {
    title: "Container Orchestrator",
    description: "Cloud Computing project",
    achievements: [
      "Capable of Load Balancing, Fault tolerance, and Health polling of docker containers",
    ],
    link: "#",
  },
];

export default function Projects() {
  return (
    <div className="">
      <h2 className="title text-xl font-semibold mb-6">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="title text-xl font-semibold mb-2">
              {project.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {project.description}
            </p>
            <ul className="list-disc list-inside mb-4">
              {project.achievements.map((achievement, i) => (
                <li key={i} className="text-sm">
                  {achievement}
                </li>
              ))}
            </ul>
            <Link href={project.link} className="text-blue-500 hover:underline">
              Learn more
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

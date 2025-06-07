import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Some of the coolest projects I've worked on.",
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
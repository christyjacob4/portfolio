import Education from "@/components/education";
import Experience from "@/components/experience";
import { BlogPosts } from "@/components/posts";
import Projects from "@/components/projects";
import TechStack from "@/components/techstack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-medium tracking-tighter">
        hey, I&apos;m christy 👋
      </h1>
      <p className="text-lg text-muted-foreground">
        I&apos;m a software engineering leader with a passion for building
        innovative solutions and fostering high-performance teams. I currently
        lead the engineering team at{" "}
        <span>
          <Link
            href="https://appwrite.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm leading-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <Image
              src="/companies/appwrite.png"
              alt="Appwrite"
              className="h-4 w-4 mr-2"
              width={16}
              height={16}
            />
            Appwrite
          </Link>
        </span>
        , where I&apos;ve been instrumental in scaling our open-source platform
        and fostering a vibrant developer community. With an eye for detail and
        a belief in simplicity, I strive to create elegant solutions to complex
        problems. My open-source contributions have impacted thousands of
        developers worldwide. Previously, I&apos;ve worked on impactful projects
        at Intuit and Samsung Research, always focusing on clean, efficient, and
        user-centric design.
      </p>

      <div className="my-14">
        <Experience />
      </div>

      <div className="my-14">
        <Education />
      </div>

      <div className="my-14">
        <TechStack />
      </div>

      {/* <div className="my-8">
        <Projects />
      </div> */}

      <div className="my-14">
        <BlogPosts />
      </div>
    </section>
  );
}

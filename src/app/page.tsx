import Education from "@/components/education";
import Experience from "@/components/experience";
import { BlogPosts } from "@/components/posts";
import Projects from "@/components/projects";
import TechStack from "@/components/techstack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ImageGallery } from "@/components/image-gallery";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-medium tracking-tighter">
        hey, i&apos;m christy 👋
      </h1>
      <p className="text-muted-foreground">
        A software engineer and open-source advocate specialized in building
        highly performant distributed systems. Currently, I lead Backend, Cloud
        and AI @ Appwrite, an open-source developer platform with over 43K stars
        on GitHub. My role involves architecting scalable cloud systems,
        mentoring a global community of developers, and driving key engineering
        initiatives.
      </p>

      <div className="my-8">
        <ImageGallery />
      </div>

      <p className="text-muted-foreground">
        I also have a strong background in AI and Machine Learning, holding a
        Master&apos;s degree in Artificial Intelligence. I&apos;ve worked with
        leading companies like Intuit and Samsung Research. Passionate about
        technology and community building, I continuously strive to push the
        boundaries of innovation.
      </p>

      {/* As a software engineering leader, I&lsquo;m passionate about innovative
        solutions and high-performance teams. I lead engineering at{"  "}
        
        , scaling our open-source platform and community. I focus on simplicity
        and elegance in problem-solving, with my open-source work impacting
        developers globally. My experience includes key roles at Intuit and
        Samsung Research, always prioritizing clean, efficient, and user-centric
        design. */}
      {/* <span>
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
        </span> */}
      {/* I'm a software developer with a masters in AI & Machine Learning
today I lead the engineering team at Appwrite, crafting building world class developer tools and .  */}
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

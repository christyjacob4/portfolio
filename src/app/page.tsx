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
      <p className="text-muted-foreground my-8">
        A software engineer and open-source advocate specialized in building
        highly performant distributed systems. Currently, I lead AI and Backend
        at{" "}
        <Link
          href="https://appwrite.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Appwrite
        </Link>
        , an open source developer platform with over{" "}
        <Link
          href="https://github.com/appwrite/appwrite"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          43K stars on GitHub.
        </Link>
      </p>

      <div className="my-8">
        <ImageGallery />
      </div>

      <p className="text-muted-foreground">
        My role involves architecting scalable cloud systems, mentoring a global
        community of developers, and driving key engineering initiatives. I also
        have a strong background in AI and Machine Learning, holding a
        Master&apos;s degree in Artificial Intelligence. Previously, I&apos;ve
        worked with leading companies like{" "}
        <Link
          href="https://www.intuit.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Intuit
        </Link>{" "}
        and{" "}
        <Link
          href="https://research.samsung.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary relative after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[1px] after:bg-primary after:transition-all after:duration-300 after:origin-left after:scale-x-0 hover:after:scale-x-100 tracking-wide"
        >
          Samsung Research
        </Link>
        .
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

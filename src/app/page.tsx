import Education from "@/components/education";
import Experience from "@/components/experience";
import { BlogPosts } from "@/components/posts";
import Projects from "@/components/projects";
import TechStack from "@/components/techstack";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        hey, I'm Christy 👋
      </h1>
      <p className="text-muted-foreground tracking-wide">
        I'm a Vim enthusiast and tab advocate, finding unmatched efficiency in
        Vim's keystroke commands and tabs' flexibility for personal viewing
        preferences. This extends to my support for static typing, where its
        early error detection ensures cleaner code, and my preference for dark
        mode, which eases long coding sessions by reducing eye strain.
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

import Link from "next/link";
import { Separator } from "./ui/separator";
import { ArrowUpRight } from "lucide-react";

const footerLinks = [
  // { href: "/rss", text: "rss" },
  { href: "https://x.com/christyjacob4", text: "twitter" },
  { href: "https://github.com/christyjacob4", text: "github" },
  { href: "https://www.linkedin.com/in/christyjacob4/", text: "linkedin" },
  { href: "mailto:christyjacob4@gmail.com", text: "email" },
  // {
  //   href: "https://vercel.com/templates/next.js/portfolio-starter-kit",
  //   text: "view source",
  // },
];

export default function Footer() {
  return (
    <footer className="my-8">
      <ul className="flex flex-col space-x-0 space-y-2 md:flex-row md:space-x-4 md:space-y-0">
        {footerLinks.map((link, index) => (
          <li key={index}>
            <Link
              className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100 group"
              rel="noopener noreferrer"
              target="_blank"
              href={link.href}
            >
              <ArrowUpRight className="h-5 w-5" />
              <p className="ml-1 relative">
                {link.text}
                <span className="absolute left-0 -bottom-0.5 w-full h-[1px] bg-current transform scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100"></span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <Separator className="my-8" />
      <p className="italic text-sm">
        &ldquo;Knowledge is discovered collectively, wisdom is rediscovered
        individually.&rdquo;
      </p>
      <p className="mt-1 text-muted-foreground text-sm">- Naval Ravikant</p>
    </footer>
  );
}

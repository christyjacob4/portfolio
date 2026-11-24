import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const links = [
  { href: "https://github.com/christyjacob4", text: "GitHub" },
  { href: "https://x.com/christyjacob4", text: "X" },
  { href: "https://www.linkedin.com/in/christyjacob4/", text: "LinkedIn" },
  { href: "mailto:christyjacob4@gmail.com", text: "Email" },
  { href: "/rss", text: "RSS", internal: true },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid w-full max-w-[72rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <p className="display text-3xl sm:text-4xl max-w-md">
            &ldquo;Knowledge is discovered collectively, wisdom is rediscovered
            individually.&rdquo;
          </p>
          <p className="mt-3 eyebrow">Naval Ravikant</p>
        </div>
        <nav aria-label="Elsewhere">
          <p className="eyebrow mb-4">Elsewhere</p>
          <ul className="grid grid-cols-2 gap-y-2">
            {links.map((l) => (
              <li key={l.text}>
                {l.internal ? (
                  <a href={l.href} className="group inline-flex items-center gap-1 py-1">
                    <span className="link-u">{l.text}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </a>
                ) : (
                  <Link
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 py-1"
                  >
                    <span className="link-u">{l.text}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Christy Jacob
          </p>
        </nav>
      </div>
    </footer>
  );
}

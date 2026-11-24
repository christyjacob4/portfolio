"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/blog", name: "Writing" },
  { href: "/work", name: "Work" },
  { href: "/projects", name: "Projects" },
  { href: "/talks", name: "Talks" },
];

export function Navbar() {
  const pathname = usePathname() ?? "/";
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[72rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="display text-[1.55rem] leading-none"
        >
          <span className="sr-only">Christy Jacob</span>
          <span className="sm:hidden" aria-hidden>C<span className="italic text-brand">J</span></span>
          <span className="hidden sm:inline" aria-hidden>
            Christy <span className="italic text-brand">Jacob</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label="Primary" className="flex items-center">
            <ul className="flex items-center gap-0.5 sm:gap-1 text-[0.9rem]">
              {navItems.map(({ href, name }) => {
                const active = pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`relative block rounded-full px-2.5 py-1.5 transition-colors sm:px-3 ${
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

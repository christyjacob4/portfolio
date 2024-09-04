"use client";

import Link from "next/link";

const navItems = {
  "/": {
    name: "home",
  },
  "/work": {
    name: "work",
  },
  "/projects": {
    name: "projects",
  },
  "/talks": {
    name: "talks",
  },
  // "/blog": {
  //   name: "blog",
  // },
};

export function Navbar() {
  return (
    <aside className="-ml-[8px] mb-16 mt-8">
      <div className="lg:sticky lg:top-20">
        <nav
          className="flex flex-row items-start relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
          id="nav"
        >
          <div className="flex flex-row space-x-2 pr-10">
            {Object.entries(navItems).map(([path, { name }]) => {
              return (
                <Link
                  key={path}
                  href={path}
                  className="transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center relative px-2 py-2 group"
                >
                  <span className="relative">
                    {name}
                    <span className="absolute left-0 -bottom-0.5 w-full h-[1px] bg-current transform scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100"></span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}

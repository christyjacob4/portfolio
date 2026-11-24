import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="py-24 sm:py-32">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-[clamp(3rem,10vw,7rem)]">
        Lost in the <span className="italic text-brand">context window</span>
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">
        That page isn&apos;t here. It may have moved, or it never existed.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
      >
        Back home
      </Link>
    </section>
  );
}

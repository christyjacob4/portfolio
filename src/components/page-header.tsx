export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
}) {
  return (
    <header className="pb-10 pt-12 sm:pb-14 sm:pt-20">
      <p className="eyebrow rise">{eyebrow}</p>
      <h1 className="display rise mt-4 text-[clamp(3rem,9vw,6rem)]" style={{ ["--i" as string]: 1 }}>
        {title}
      </h1>
      {lede && (
        <p
          className="rise mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
          style={{ ["--i" as string]: 2 }}
        >
          {lede}
        </p>
      )}
    </header>
  );
}

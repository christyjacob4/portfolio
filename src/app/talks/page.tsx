import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Talks",
  description: "Talks and presentations.",
};

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Talks"
        title={
          <>
            On <span className="italic text-brand">stage</span>
          </>
        }
        lede="Nothing recorded yet. Coming soon."
      />
    </>
  );
}

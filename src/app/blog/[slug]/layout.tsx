import "katex/dist/katex.min.css";
import "@/styles/mdx.css";
import "@/styles/mermaid.css";
import "@/styles/prism.css";
import { Source_Serif_4 } from "next/font/google";

// Reading face, self-hosted by next/font and only preloaded on post pages.
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz"],
});

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <div className={serif.variable}>{children}</div>;
}

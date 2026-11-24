import "./global.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Lora } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});
import { Navbar } from "../components/nav";
import Footer from "../components/footer";
import { baseUrl } from "./sitemap";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Christy Jacob",
    template: "%s | Christy Jacob",
  },
  description: "Engineer at Magic. Writing about ML systems and infrastructure.",
  openGraph: {
    title: "Christy Jacob",
    description: "Engineer at Magic. Writing about ML systems and infrastructure",
    url: baseUrl,
    siteName: "Christy Jacob",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cx(
        "dark min-h-screen bg-background font-sans overflow-x-hidden",
        GeistSans.variable,
        GeistMono.variable,
        lora.variable,
      )}
    >
      <body className="antialiased bg-background text-foreground">
        {/* TODO: Cloudflare Web Analytics beacon goes here (add the script once the token exists). */}
        <div aria-hidden="true" className="grain" />
        <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-4">
          <main className="flex flex-col min-h-screen">
            <Navbar />
            {children}
            <Footer />
          </main>
        </div>
      </body>
    </html>
  );
}

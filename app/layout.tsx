import type { Metadata } from "next";
import "@/app/globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1ba5bb33.menu-piker.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Emotion Radar — Feel the Internet",
    template: "%s · Emotion Radar"
  },
  description:
    "Emotion Radar visualizes how the internet feels about trending issues — fast, opinionated, and built for signal.",
  openGraph: {
    title: "Emotion Radar — Feel the Internet",
    description:
      "See trending issues summarized emotionally: anger, humor, and division at a glance.",
    url: siteUrl,
    siteName: "Emotion Radar",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Emotion Radar — Feel the Internet",
    description:
      "A public sentiment visualization engine for internet issues. Emotion over information."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}

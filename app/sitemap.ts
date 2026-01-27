import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/services/issueGenerator";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1ba5bb33.menu-piker.pages.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllSlugs();
  const now = new Date();

  const base: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1
    }
  ];

  const issues: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${siteUrl}/issue/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8
  }));

  return [...base, ...issues];
}

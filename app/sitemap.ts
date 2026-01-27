import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { getAllSlugs } from "@/services/issueGenerator";

export const runtime = "nodejs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1ba5bb33.menu-piker.pages.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const base: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1
    },
    {
      url: `${siteUrl}/daily`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    }
  ];

  try {
    const issues = await prisma.issue.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 500
    });

    const issueEntries: MetadataRoute.Sitemap = issues.map((issue) => ({
      url: `${siteUrl}/issue/${issue.slug}`,
      lastModified: issue.updatedAt,
      changeFrequency: "daily",
      priority: 0.8
    }));

    return [...base, ...issueEntries];
  } catch {
    const fallbackSlugs = getAllSlugs();
    const issueEntries: MetadataRoute.Sitemap = fallbackSlugs.map((slug) => ({
      url: `${siteUrl}/issue/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7
    }));
    return [...base, ...issueEntries];
  }
}

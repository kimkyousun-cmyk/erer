import { utcDateString } from "@/lib/time";

export interface FeedIssueRow {
  issue: {
    id: string;
    slug: string;
    title: string;
    contextSummary: string;
    verdictLine: string;
    dominantEmotion: string;
    angerScore: number;
    humorScore: number;
    divisionScore: number;
    tags: string;
    status: string;
    requiresEdit: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
  };
  trendScore: number | null;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export const FeedRepo = {
  async listTrending(dateKey: string, take: number, skip: number): Promise<FeedIssueRow[]> {
    const { prisma } = await import("@/lib/db/prisma");

    const metrics = await prisma.issueMetricsDaily.findMany({
      where: { date: dateKey },
      orderBy: [{ trendScore: "desc" }],
      include: {
        issue: true
      },
      take,
      skip
    });

    return metrics
      .filter((row) => row.issue.status === "PUBLISHED")
      .map((row) => ({
        issue: row.issue,
        trendScore: row.trendScore
      }));
  },

  async listPublished(take: number, skip: number, orderBy: "publishedAt" | "humorScore" | "angerScore" | "divisionScore") {
    const { prisma } = await import("@/lib/db/prisma");

    return prisma.issue.findMany({
      where: { status: "PUBLISHED" },
      orderBy: {
        [orderBy]: "desc"
      },
      take,
      skip
    });
  },

  async listPublishedRecent(take: number) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issue.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take
    });
  },

  async getTrendScores(dateKey: string, issueIds: string[]) {
    if (issueIds.length === 0) return new Map<string, number>();
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.issueMetricsDaily.findMany({
      where: {
        date: dateKey,
        issueId: { in: unique(issueIds) }
      },
      select: { issueId: true, trendScore: true }
    });
    return new Map(rows.map((row) => [row.issueId, row.trendScore]));
  },

  async getMetricsForDate(dateKey: string, issueIds: string[]) {
    if (issueIds.length === 0) return new Map<string, number>();
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.issueMetricsDaily.findMany({
      where: {
        date: dateKey,
        issueId: { in: unique(issueIds) }
      },
      select: { issueId: true, trendScore: true }
    });
    return new Map(rows.map((row) => [row.issueId, row.trendScore]));
  },

  async listSessionEvents(sessionHash: string, take: number) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.event.findMany({
      where: { sessionHash },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        eventName: true,
        tags: true,
        issueId: true,
        createdAt: true
      }
    });
  },

  async listSessionHides(sessionHash: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const hides = await prisma.hide.findMany({
      where: { sessionHash },
      select: { issueId: true }
    });
    return hides.map((h) => h.issueId);
  },

  async listSessionFollowTags(sessionHash: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const follows = await prisma.followTag.findMany({
      where: { sessionHash },
      orderBy: { createdAt: "desc" },
      select: { tag: true }
    });
    return unique(follows.map((f) => f.tag));
  },

  todayKey() {
    return utcDateString(new Date());
  }
};

import { utcDayRange } from "@/lib/time";

export interface IssueEventCounts {
  issueId: string;
  impressions: number;
  opens: number;
  shares: number;
  votes: number;
  exports: number;
}

function emptyCounts(issueId: string): IssueEventCounts {
  return {
    issueId,
    impressions: 0,
    opens: 0,
    shares: 0,
    votes: 0,
    exports: 0
  };
}

function addEventCount(target: IssueEventCounts, eventName: string, count: number) {
  switch (eventName) {
    case "ISSUE_CARD_VIEW":
      target.impressions += count;
      break;
    case "ISSUE_OPEN":
      target.opens += count;
      break;
    case "SHARE_CLICK":
      target.shares += count;
      break;
    case "VOTE_SUBMIT":
      target.votes += count;
      break;
    case "EXPORT_CLICK":
      target.exports += count;
      break;
    default:
      break;
  }
}

export const EventMetricsRepo = {
  async listIssueEventCountsForUtcDay(date: Date = new Date()): Promise<IssueEventCounts[]> {
    const { prisma } = await import("@/lib/db/prisma");
    const { start, end } = utcDayRange(date);

    const rows = await prisma.event.groupBy({
      by: ["issueId", "eventName"],
      where: {
        issueId: { not: null },
        createdAt: {
          gte: start,
          lt: end
        }
      },
      _count: {
        _all: true
      }
    });

    const map = new Map<string, IssueEventCounts>();

    for (const row of rows) {
      const issueId = row.issueId;
      if (!issueId) continue;
      const counts = map.get(issueId) ?? emptyCounts(issueId);
      addEventCount(counts, row.eventName, row._count._all);
      map.set(issueId, counts);
    }

    return Array.from(map.values());
  },

  async upsertIssueMetricsDaily(input: {
    issueId: string;
    dateKey: string;
    impressions: number;
    opens: number;
    shares: number;
    votes: number;
    exports: number;
    trendScore: number;
  }) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issueMetricsDaily.upsert({
      where: {
        issueId_date: {
          issueId: input.issueId,
          date: input.dateKey
        }
      },
      update: {
        impressions: input.impressions,
        opens: input.opens,
        shares: input.shares,
        votes: input.votes,
        exports: input.exports,
        trendScore: input.trendScore
      },
      create: {
        issueId: input.issueId,
        date: input.dateKey,
        impressions: input.impressions,
        opens: input.opens,
        shares: input.shares,
        votes: input.votes,
        exports: input.exports,
        trendScore: input.trendScore
      }
    });
  },

  async listPublishedIssuesByIds(issueIds: string[]) {
    if (issueIds.length === 0) return [];
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issue.findMany({
      where: {
        id: { in: issueIds },
        status: "PUBLISHED"
      },
      select: {
        id: true,
        publishedAt: true,
        createdAt: true
      }
    });
  }
};

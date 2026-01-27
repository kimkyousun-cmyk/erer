export type FeedbackType = "CONFUSING" | "BIASED" | "LOW_QUALITY" | "REPETITIVE" | "GREAT";

function sanitizeNote(note: string | null | undefined) {
  if (!note) return null;
  const cleaned = note.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, 200);
}

export const FeedbackRepo = {
  async createFeedback(input: {
    issueId: string;
    sessionHash: string;
    type: FeedbackType;
    note?: string | null;
  }) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issueFeedback.create({
      data: {
        issueId: input.issueId,
        sessionHash: input.sessionHash,
        type: input.type,
        note: sanitizeNote(input.note)
      }
    });
  },

  async listFeedbackCounts(issueId: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.issueFeedback.groupBy({
      by: ["type"],
      where: { issueId },
      _count: { _all: true }
    });
    return new Map(rows.map((row) => [row.type as FeedbackType, row._count._all]));
  },

  async listRecentFeedback(limit: number) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issueFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true
          }
        }
      }
    });
  },

  async listIssueFeedbackSummary(limit: number) {
    const { prisma } = await import("@/lib/db/prisma");
    const grouped = await prisma.issueFeedback.groupBy({
      by: ["issueId"],
      _count: { _all: true },
      orderBy: { _count: { issueId: "desc" } },
      take: limit
    });

    const issueIds = grouped.map((g) => g.issueId);
    if (issueIds.length === 0) return [] as Array<{ issueId: string; count: number; issue: { id: string; title: string; slug: string; status: string } | null }>;

    const issues = await prisma.issue.findMany({
      where: { id: { in: issueIds } },
      select: { id: true, title: true, slug: true, status: true }
    });
    const issueMap = new Map(issues.map((i) => [i.id, i]));

    return grouped.map((g) => ({
      issueId: g.issueId,
      count: g._count._all,
      issue: issueMap.get(g.issueId) ?? null
    }));
  }
};

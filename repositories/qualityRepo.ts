import { utcDayRange } from "@/lib/time";

function serializeFlags(flags: string[]) {
  return Array.from(new Set(flags.map((f) => f.trim()).filter(Boolean))).join(",");
}

function deserializeFlags(flags: string | null | undefined) {
  if (!flags) return [] as string[];
  return flags
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

export interface QualityReportRecord {
  id: string;
  issueId: string;
  qualityScore: number;
  action: string;
  flags: string[];
  explanation: string;
  runType: string;
  createdAt: Date;
}

export const QualityRepo = {
  async createReport(input: {
    issueId: string;
    qualityScore: number;
    action: "PASS" | "NEEDS_EDIT" | "BLOCK_PUBLISH";
    flags: string[];
    explanation: string;
    runType: "ON_CREATE" | "ON_PUBLISH" | "NIGHTLY";
  }): Promise<QualityReportRecord> {
    const { prisma } = await import("@/lib/db/prisma");
    const record = await prisma.qualityReport.create({
      data: {
        issueId: input.issueId,
        qualityScore: input.qualityScore,
        action: input.action,
        flags: serializeFlags(input.flags),
        explanation: input.explanation,
        runType: input.runType
      }
    });
    return {
      ...record,
      flags: deserializeFlags(record.flags)
    };
  },

  async getLatestReport(issueId: string): Promise<QualityReportRecord | null> {
    const { prisma } = await import("@/lib/db/prisma");
    const record = await prisma.qualityReport.findFirst({
      where: { issueId },
      orderBy: { createdAt: "desc" }
    });
    if (!record) return null;
    return { ...record, flags: deserializeFlags(record.flags) };
  },

  async listRecentIssues(limit: number) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issue.findMany({
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        contextSummary: true,
        tags: true,
        status: true,
        createdAt: true,
        publishedAt: true
      }
    });
  },

  async listIssuesCreatedOnUtcDay(date: Date) {
    const { prisma } = await import("@/lib/db/prisma");
    const { start, end } = utcDayRange(date);
    return prisma.issue.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        id: true,
        tags: true,
        createdAt: true
      }
    });
  },

  async listRecentGenerationSeeds(limit: number) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issueGenerationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        issueId: true,
        inputText: true,
        createdAt: true
      }
    });
  },

  async listPublishedIssueIds(limit: number) {
    const { prisma } = await import("@/lib/db/prisma");
    const issues = await prisma.issue.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: { id: true }
    });
    return issues.map((i) => i.id);
  }
};

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/log";
import { computeIssueScores } from "@/services/aggregation/issueAggregation";
import { toIssueSummary } from "@/services/issues/issueMapper";
import { listIssues as listSeedIssues } from "@/services/issueGenerator";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKey(date: Date) {
  return startOfWeek(date).toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  mood: {
    angerIndex: number;
    humorIndex: number;
    divisionIndex: number;
  };
  highlights: {
    mostDivided: string | null;
    mostHumorous: string | null;
    mostAngry: string | null;
  };
  topIssues: Awaited<ReturnType<typeof toIssueSummary>>[];
}

export async function generateWeeklyReport(weekStartInput?: string): Promise<WeeklyReport> {
  const weekStartDate = weekStartInput ? new Date(`${weekStartInput}T00:00:00.000Z`) : startOfWeek(new Date());
  const weekEndDate = addDays(weekStartDate, 6);

  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const weekEnd = weekEndDate.toISOString().slice(0, 10);

  try {
    const issues = await prisma.issue.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: {
          gte: weekStartDate,
          lte: addDays(weekEndDate, 1)
        }
      },
      include: {
        timelineEvents: { orderBy: { order: "asc" } },
        reactions: true,
        shortsJobs: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      take: 80
    });

    const aggregates = await Promise.all(
      issues.map(async (issue) => {
        const agg = await computeIssueScores(issue);
        return {
          issue,
          agg,
          heat: agg.anger + agg.humor + agg.division
        };
      })
    );

    aggregates.sort((a, b) => b.heat - a.heat);
    const top = aggregates.slice(0, 8);

    const mood = top.length
      ? {
          angerIndex: Math.round(top.reduce((s, t) => s + t.agg.anger, 0) / top.length),
          humorIndex: Math.round(top.reduce((s, t) => s + t.agg.humor, 0) / top.length),
          divisionIndex: Math.round(top.reduce((s, t) => s + t.agg.division, 0) / top.length)
        }
      : { angerIndex: 50, humorIndex: 50, divisionIndex: 50 };

    const mostDivided = aggregates.sort((a, b) => b.agg.division - a.agg.division)[0]?.issue.title ?? null;
    const mostHumorous = aggregates.sort((a, b) => b.agg.humor - a.agg.humor)[0]?.issue.title ?? null;
    const mostAngry = aggregates.sort((a, b) => b.agg.anger - a.agg.anger)[0]?.issue.title ?? null;

    const topIssues = await Promise.all(top.map((t) => toIssueSummary(t.issue)));

    return {
      weekStart,
      weekEnd,
      mood,
      highlights: { mostDivided, mostHumorous, mostAngry },
      topIssues
    };
  } catch (err) {
    logger.warn("weekly_report.fallback", {
      weekStart,
      error: err instanceof Error ? err.message : String(err)
    });
    const fallbackIssues = listSeedIssues().slice(0, 5);
    return {
      weekStart,
      weekEnd,
      mood: { angerIndex: 62, humorIndex: 55, divisionIndex: 71 },
      highlights: {
        mostDivided: fallbackIssues[0]?.title ?? null,
        mostHumorous: fallbackIssues[1]?.title ?? null,
        mostAngry: fallbackIssues[2]?.title ?? null
      },
      topIssues: fallbackIssues
    };
  }
}

export function defaultWeekKey() {
  return weekKey(new Date());
}

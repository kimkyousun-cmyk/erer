import { logger } from "@/lib/log";
import { hoursSince, utcDayRange } from "@/lib/time";
import { EventMetricsRepo, type IssueEventCounts } from "@/repositories/eventMetricsRepo";

function safeDivide(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Recency is intentionally opinionated: fresh issues get a meaningful boost,
// but the boost decays quickly to keep the feed feeling "now".
export function recencyBoost(hours: number) {
  if (!Number.isFinite(hours)) return 0.15;
  if (hours <= 6) return 1.25;
  if (hours <= 24) return 1.0;
  if (hours <= 72) return 0.75;
  if (hours <= 168) return 0.45;
  return 0.2;
}

// The weights below favor engagement quality over raw volume.
// Scores are bounded to 0..100 for stable downstream ranking.
export function computeTrendScore(input: {
  counts: IssueEventCounts;
  hoursSincePublished: number;
}) {
  const impressions = Math.max(input.counts.impressions, 1);

  const openRate = clamp(safeDivide(input.counts.opens, impressions), 0, 1.5);
  const shareRate = clamp(safeDivide(input.counts.shares, impressions), 0, 0.5);
  const voteRate = clamp(safeDivide(input.counts.votes, impressions), 0, 0.8);
  const exportRate = clamp(safeDivide(input.counts.exports, impressions), 0, 0.6);

  const engagementRate = clamp(openRate * 0.7 + voteRate * 0.3, 0, 1.2);
  const boost = recencyBoost(input.hoursSincePublished);

  const raw =
    boost * 35 +
    engagementRate * 30 +
    shareRate * 18 +
    voteRate * 10 +
    exportRate * 12;

  return clamp(Math.round(raw), 0, 100);
}

export interface TrendAggregationResult {
  dateKey: string;
  processedIssues: number;
  updatedMetrics: number;
}

export const TrendAggregationService = {
  async aggregateUtcDay(date: Date = new Date()): Promise<TrendAggregationResult> {
    const { dateKey } = utcDayRange(date);
    const counts = await EventMetricsRepo.listIssueEventCountsForUtcDay(date);

    if (counts.length === 0) {
      logger.info("trend_aggregation.no_events", { dateKey });
      return { dateKey, processedIssues: 0, updatedMetrics: 0 };
    }

    const issueIds = counts.map((c) => c.issueId);
    const issues = await EventMetricsRepo.listPublishedIssuesByIds(issueIds);
    const issuesById = new Map(issues.map((issue) => [issue.id, issue]));

    let updatedMetrics = 0;

    for (const entry of counts) {
      const issue = issuesById.get(entry.issueId);
      if (!issue) continue;

      const publishedAt = issue.publishedAt ?? issue.createdAt;
      const trendScore = computeTrendScore({
        counts: entry,
        hoursSincePublished: hoursSince(publishedAt)
      });

      await EventMetricsRepo.upsertIssueMetricsDaily({
        issueId: entry.issueId,
        dateKey,
        impressions: entry.impressions,
        opens: entry.opens,
        shares: entry.shares,
        votes: entry.votes,
        exports: entry.exports,
        trendScore
      });

      updatedMetrics += 1;
    }

    logger.info("trend_aggregation.completed", {
      dateKey,
      processedIssues: counts.length,
      updatedMetrics
    });

    return {
      dateKey,
      processedIssues: counts.length,
      updatedMetrics
    };
  }
};

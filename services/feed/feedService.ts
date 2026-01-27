import { z } from "zod";
import { hoursSince, utcDateString } from "@/lib/time";
import { getSessionHash } from "@/lib/security/session";
import { isDemoMode } from "@/lib/demo";
import { FeedRepo } from "@/repositories/feedRepo";
import { toIssueSummary } from "@/services/issues/issueMapper";
import { ExperimentService } from "@/services/experiments/experimentService";
import { listIssues as listSeedIssues } from "@/services/issueGenerator";

const feedModes = [
  "trending",
  "new",
  "funny",
  "angry",
  "divided",
  "for_you",
  "following"
] as const;

export type FeedMode = (typeof feedModes)[number];

const feedQuerySchema = z.object({
  mode: z.enum(feedModes).default("trending"),
  take: z.coerce.number().int().min(1).max(40).default(20),
  skip: z.coerce.number().int().min(0).max(2000).default(0),
  tag: z.string().trim().min(1).max(32).optional()
});

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function intersects(a: string[], b: string[]) {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.some((x) => setB.has(x.toLowerCase()));
}

function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

const eventWeights: Record<string, number> = {
  ISSUE_CARD_VIEW: 1,
  ISSUE_OPEN: 3,
  ISSUE_SCROLL_25: 2,
  ISSUE_SCROLL_75: 3,
  VOTE_SUBMIT: 3,
  SHARE_CLICK: 4,
  EXPORT_CLICK: 5
};

function computeTagAffinity(events: Array<{ eventName: string; tags: string | null }>) {
  const scores = new Map<string, number>();
  for (const event of events) {
    const tags = event.tags ? parseTags(event.tags) : [];
    if (tags.length === 0) continue;
    const weight = eventWeights[event.eventName] ?? 1;
    for (const tag of tags) {
      scores.set(tag, (scores.get(tag) ?? 0) + weight);
    }
  }
  return scores;
}

function topTagsByAffinity(affinity: Map<string, number>, limit: number) {
  return Array.from(affinity.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function scoreForYouIssue(input: {
  issueId: string;
  issueTags: string[];
  topTags: string[];
  affinity: Map<string, number>;
  trendScore: number;
  publishedAt: Date | null;
  todayKey: string;
}) {
  const affinityScore = input.issueTags.reduce((sum, tag) => sum + (input.affinity.get(tag) ?? 0), 0);
  const affinityNormalized = Math.min(40, affinityScore * 2);
  const trendNormalized = Math.min(45, input.trendScore);

  const hoursAgo = input.publishedAt
    ? (Date.now() - input.publishedAt.getTime()) / (1000 * 60 * 60)
    : 999;
  const recencyBoost = hoursAgo <= 24 ? 10 : hoursAgo <= 72 ? 6 : 2;

  const explorationSeed = `${input.issueId}:${input.todayKey}`;
  const explorationJitter = (hashString(explorationSeed) % 11) - 5;

  return affinityNormalized + trendNormalized + recencyBoost + explorationJitter;
}

function applyTagFilter<T extends { tags: string }>(items: T[], tag?: string) {
  if (!tag) return items;
  const normalized = tag.toLowerCase();
  return items.filter((item) => parseTags(item.tags).includes(normalized));
}

function excludeHidden<T extends { id: string }>(items: T[], hiddenIds: Set<string>) {
  if (hiddenIds.size === 0) return items;
  return items.filter((item) => !hiddenIds.has(item.id));
}

function recencyBoost(date: Date | null) {
  const hours = hoursSince(date);
  if (hours <= 24) return 12;
  if (hours <= 72) return 6;
  if (hours <= 168) return 3;
  return 0;
}

async function mapSummariesWithTrend(dateKey: string, issues: Array<{ id: string } & Record<string, unknown>>) {
  const trendScores = await FeedRepo.getTrendScores(
    dateKey,
    issues.map((issue) => issue.id)
  );

  return Promise.all(
    issues.map(async (issue) =>
      toIssueSummary(issue as Parameters<typeof toIssueSummary>[0], {
        trendScore: trendScores.get(issue.id) ?? null
      })
    )
  );
}

export interface FeedResult {
  mode: FeedMode;
  take: number;
  skip: number;
  dateKey: string;
  issues: Awaited<ReturnType<typeof toIssueSummary>>[];
}

export const FeedService = {
  async getFeed(searchParams: URLSearchParams): Promise<FeedResult> {
    const parsed = feedQuerySchema.parse({
      mode: searchParams.get("mode") ?? undefined,
      take: searchParams.get("take") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
      tag: searchParams.get("tag") ?? undefined
    });

    if (isDemoMode()) {
      const dateKey = utcDateString(new Date());
      const all = listSeedIssues();
      const normalizedTag = parsed.tag?.toLowerCase();
      const tagFiltered = normalizedTag
        ? all.filter((issue) => issue.tags.map((t) => t.toLowerCase()).includes(normalizedTag))
        : all;

      const sorted = [...tagFiltered].sort((a, b) => {
        if (parsed.mode === "funny") return b.scores.humor - a.scores.humor;
        if (parsed.mode === "angry") return b.scores.anger - a.scores.anger;
        if (parsed.mode === "divided") return b.scores.division - a.scores.division;
        if (parsed.mode === "new") return b.updatedAt.localeCompare(a.updatedAt);
        // trending / for_you / following fall back to overall intensity
        const intensityA = a.scores.anger + a.scores.humor + a.scores.division;
        const intensityB = b.scores.anger + b.scores.humor + b.scores.division;
        return intensityB - intensityA;
      });

      const issues = sorted.slice(parsed.skip, parsed.skip + parsed.take);
      return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues };
    }

    const sessionHash = getSessionHash();
    const dateKey = utcDateString(new Date());

    const [hiddenIds, followedTags, sessionEvents, feedOrderVariant] = await Promise.all([
      FeedRepo.listSessionHides(sessionHash),
      FeedRepo.listSessionFollowTags(sessionHash),
      FeedRepo.listSessionEvents(sessionHash, 80),
      ExperimentService.getVariant("FEED_ORDER_TWEAK")
    ]);

    const hiddenSet = new Set(hiddenIds);
    const applyRecentBias = feedOrderVariant.active && feedOrderVariant.variant !== "control";

    if (parsed.mode === "trending") {
      const trending = await FeedRepo.listTrending(dateKey, parsed.take * 3, parsed.skip);
      if (trending.length > 0) {
        const rankedTrending = applyRecentBias
          ? [...trending].sort((a, b) => {
              const scoreA = (a.trendScore ?? 0) + recencyBoost(a.issue.publishedAt);
              const scoreB = (b.trendScore ?? 0) + recencyBoost(b.issue.publishedAt);
              return scoreB - scoreA;
            })
          : trending;
        const filtered = applyTagFilter(
          rankedTrending.map((t) => ({ ...t.issue, trendScore: t.trendScore })),
          parsed.tag
        );
        const visible = excludeHidden(filtered, hiddenSet).slice(parsed.skip, parsed.skip + parsed.take);
        const summaries = await Promise.all(
          visible.map((row) => toIssueSummary(row, { trendScore: row.trendScore }))
        );
        return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
      }
      // Fall back to recent published when no metrics exist yet.
    }

    if (parsed.mode === "new") {
      const issues = await FeedRepo.listPublished(parsed.take, parsed.skip, "publishedAt");
      const filtered = applyTagFilter(issues, parsed.tag);
      const visible = excludeHidden(filtered, hiddenSet);
      const summaries = await mapSummariesWithTrend(dateKey, visible);
      return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
    }

    if (parsed.mode === "funny") {
      const issues = await FeedRepo.listPublished(parsed.take, parsed.skip, "humorScore");
      const filtered = applyTagFilter(issues, parsed.tag);
      const visible = excludeHidden(filtered, hiddenSet);
      const summaries = await mapSummariesWithTrend(dateKey, visible);
      return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
    }

    if (parsed.mode === "angry") {
      const issues = await FeedRepo.listPublished(parsed.take, parsed.skip, "angerScore");
      const filtered = applyTagFilter(issues, parsed.tag);
      const visible = excludeHidden(filtered, hiddenSet);
      const summaries = await mapSummariesWithTrend(dateKey, visible);
      return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
    }

    if (parsed.mode === "divided") {
      const issues = await FeedRepo.listPublished(parsed.take, parsed.skip, "divisionScore");
      const filtered = applyTagFilter(issues, parsed.tag);
      const visible = excludeHidden(filtered, hiddenSet);
      const summaries = await mapSummariesWithTrend(dateKey, visible);
      return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
    }

    if (parsed.mode === "following") {
      const tags = parsed.tag ? [parsed.tag] : followedTags;
      const candidates = await FeedRepo.listPublishedRecent(Math.max(60, parsed.take * 3));
      const filteredByFollow = tags.length
        ? candidates.filter((issue) => intersects(parseTags(issue.tags), tags))
        : candidates;
      const visible = excludeHidden(applyTagFilter(filteredByFollow, parsed.tag), hiddenSet).slice(
        parsed.skip,
        parsed.skip + parsed.take
      );
      const summaries = await mapSummariesWithTrend(dateKey, visible);
      return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
    }

    // for_you
    const affinity = computeTagAffinity(sessionEvents);
    const topTags = topTagsByAffinity(affinity, 4);
    const candidates = await FeedRepo.listPublishedRecent(Math.max(90, parsed.take * 4));
    const trendScores = await FeedRepo.getTrendScores(
      dateKey,
      candidates.map((c) => c.id)
    );

    const scored = candidates
      .map((issue) => {
        const issueTags = parseTags(issue.tags);
        const trendScore = trendScores.get(issue.id) ?? 0;
        const score = scoreForYouIssue({
          issueId: issue.id,
          issueTags,
          topTags,
          affinity,
          trendScore,
          publishedAt: issue.publishedAt,
          todayKey: dateKey
        });
        return { issue, issueTags, trendScore, score };
      })
      .filter((row) => !hiddenSet.has(row.issue.id))
      .filter((row) => (topTags.length === 0 ? true : intersects(row.issueTags, topTags)))
      .sort((a, b) => b.score - a.score)
      .slice(parsed.skip, parsed.skip + parsed.take);

    const summaries = await Promise.all(
      scored.map((row) => toIssueSummary(row.issue, { trendScore: row.trendScore }))
    );

    return { mode: parsed.mode, take: parsed.take, skip: parsed.skip, dateKey, issues: summaries };
  }
};

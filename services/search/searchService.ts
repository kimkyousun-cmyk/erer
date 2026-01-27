import { z } from "zod";
import { utcDateString } from "@/lib/time";
import { isDemoMode } from "@/lib/demo";
import { FeedRepo } from "@/repositories/feedRepo";
import { SearchRepo } from "@/repositories/searchRepo";
import { toIssueSummary } from "@/services/issues/issueMapper";
import { listIssues as listSeedIssues } from "@/services/issueGenerator";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
  take: z.coerce.number().int().min(1).max(30).default(20),
  skip: z.coerce.number().int().min(0).max(2000).default(0),
  sort: z.enum(["relevance", "trending", "new"]).default("relevance")
});

function sanitizeQuery(input: string) {
  // Strip characters that are likely to be operator-like or noisy while
  // keeping the query readable and user-intent aligned.
  const cleaned = input
    .replace(/["'`]/g, " ")
    .replace(/[<>={}\[\]|^~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 80);
}

function normalize(text: string) {
  return text.toLowerCase();
}

function computeTextRelevance(query: string, issue: { title: string; contextSummary: string; verdictLine: string; tags: string }) {
  const q = normalize(query);
  const title = normalize(issue.title);
  const context = normalize(issue.contextSummary);
  const verdict = normalize(issue.verdictLine);
  const tags = normalize(issue.tags);

  let score = 0;
  if (title.includes(q)) score += 60;
  if (verdict.includes(q)) score += 28;
  if (context.includes(q)) score += 24;
  if (tags.includes(q)) score += 18;

  // Reward partial token matches lightly to avoid brittle ranking.
  const tokens = q.split(" ").filter((t) => t.length >= 3).slice(0, 6);
  for (const token of tokens) {
    if (title.includes(token)) score += 12;
    if (context.includes(token)) score += 6;
    if (tags.includes(token)) score += 8;
  }

  return Math.min(100, score);
}

export interface SearchResult {
  query: string;
  take: number;
  skip: number;
  sort: "relevance" | "trending" | "new";
  dateKey: string;
  issues: Awaited<ReturnType<typeof toIssueSummary>>[];
}

export const SearchService = {
  sanitizeQuery,

  async search(params: URLSearchParams): Promise<SearchResult | null> {
    const raw = params.get("q");
    if (!raw) return null;

    const sanitized = sanitizeQuery(raw);
    if (!sanitized) return null;

    const parsed = searchQuerySchema.parse({
      q: sanitized,
      take: params.get("take") ?? undefined,
      skip: params.get("skip") ?? undefined,
      sort: params.get("sort") ?? undefined
    });

    const dateKey = utcDateString(new Date());

    if (isDemoMode()) {
      const all = listSeedIssues();
      const rankedDemo = all
        .map((issue) => {
          const relevance = computeTextRelevance(parsed.q, {
            title: issue.title,
            contextSummary: issue.context,
            verdictLine: issue.verdict.label,
            tags: issue.tags.join(",")
          });
          const trendLike = issue.scores.anger + issue.scores.humor + issue.scores.division;
          const blended =
            parsed.sort === "trending"
              ? trendLike * 0.7 + relevance * 0.3
              : parsed.sort === "new"
                ? relevance * 0.6 + trendLike * 0.4
                : relevance * 0.75 + trendLike * 0.25;
          return { issue, blended };
        })
        .filter((row) => row.blended > 0)
        .sort((a, b) => b.blended - a.blended)
        .slice(parsed.skip, parsed.skip + parsed.take)
        .map((row) => row.issue);

      return {
        query: parsed.q,
        take: parsed.take,
        skip: parsed.skip,
        sort: parsed.sort,
        dateKey,
        issues: rankedDemo
      };
    }

    const baseResults = await SearchRepo.searchPublished({
      query: parsed.q,
      take: Math.max(parsed.take * 3, 40),
      skip: parsed.skip
    });

    if (baseResults.length === 0) {
      return {
        query: parsed.q,
        take: parsed.take,
        skip: parsed.skip,
        sort: parsed.sort,
        dateKey,
        issues: []
      };
    }

    const trendScores = await FeedRepo.getTrendScores(
      dateKey,
      baseResults.map((issue) => issue.id)
    );

    const ranked = baseResults
      .map((issue) => {
        const textRelevance = computeTextRelevance(parsed.q, issue);
        const trendScore = trendScores.get(issue.id) ?? 0;
        const blended = parsed.sort === "trending"
          ? trendScore * 0.7 + textRelevance * 0.3
          : parsed.sort === "new"
            ? textRelevance * 0.6 + trendScore * 0.4
            : textRelevance * 0.75 + trendScore * 0.25;
        return { issue, trendScore, blended };
      })
      .sort((a, b) => b.blended - a.blended)
      .slice(0, parsed.take);

    const issues = await Promise.all(
      ranked.map((row) => toIssueSummary(row.issue, { trendScore: row.trendScore }))
    );

    return {
      query: parsed.q,
      take: parsed.take,
      skip: parsed.skip,
      sort: parsed.sort,
      dateKey,
      issues
    };
  }
};

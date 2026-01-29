import { getCached, invalidateCache, setCached } from "@/lib/cache/simpleCache";
import { logger } from "@/lib/log";
import type { IssueDetail, IssueSummary } from "@/lib/types";
import { IssueRepo } from "@/repositories/issueRepo";
import { getIssueDetail as getSeedIssueDetail, listIssues as listSeedIssues } from "@/services/issueGenerator";
import { invalidateIssueAggregation } from "@/services/aggregation/issueAggregation";
import { invalidateFeedCaches } from "@/services/feed/feedService";
import { toIssueDetail, toIssueSummary } from "@/services/issues/issueMapper";

const ISSUE_LIST_CACHE_PREFIX = "issues:list:";
const ISSUE_DETAIL_CACHE_PREFIX = "issues:detail:";
const DEFAULT_TTL_SECONDS = 60;

interface ListOptions {
  status?: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
  take?: number;
  skip?: number;
}

export const IssueService = {
  async listIssues(options: ListOptions = {}): Promise<IssueSummary[]> {
    const status = options.status ?? "PUBLISHED";
    const cacheKey = `${ISSUE_LIST_CACHE_PREFIX}${status}:${options.take ?? 20}:${options.skip ?? 0}`;
    const cached = getCached<IssueSummary[]>(cacheKey);
    if (cached) return cached;

    try {
      const issues = await IssueRepo.list({
        status,
        take: options.take,
        skip: options.skip
      });

      const summaries = await Promise.all(issues.map((issue) => toIssueSummary(issue)));
      setCached(cacheKey, summaries, DEFAULT_TTL_SECONDS);
      return summaries;
    } catch (err) {
      logger.warn("issue_service.list_fallback", {
        status,
        error: err instanceof Error ? err.message : String(err)
      });
      return listSeedIssues();
    }
  },

  async getIssueDetailBySlug(slug: string): Promise<IssueDetail | null> {
    const cacheKey = `${ISSUE_DETAIL_CACHE_PREFIX}${slug}`;
    const cached = getCached<IssueDetail>(cacheKey);
    if (cached) return cached;

    try {
      const issue = await IssueRepo.getBySlug(slug);
      if (!issue) {
        return getSeedIssueDetail(slug);
      }
      if (issue.status !== "PUBLISHED") {
        return null;
      }

      const detail = await toIssueDetail({
        issue,
        timelineEvents: issue.timelineEvents,
        reactions: issue.reactions,
        shortsJobs: issue.shortsJobs
      });

      setCached(cacheKey, detail, DEFAULT_TTL_SECONDS);
      return detail;
    } catch (err) {
      logger.warn("issue_service.detail_fallback", {
        slug,
        error: err instanceof Error ? err.message : String(err)
      });
      return getSeedIssueDetail(slug);
    }
  },

  invalidateIssueCaches(slug?: string) {
    invalidateCache(ISSUE_LIST_CACHE_PREFIX);
    if (slug) invalidateCache(`${ISSUE_DETAIL_CACHE_PREFIX}${slug}`);
    invalidateIssueAggregation();
    invalidateFeedCaches();
  }
};

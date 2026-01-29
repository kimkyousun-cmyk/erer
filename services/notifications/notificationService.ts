import { logger } from "@/lib/log";
import { FollowRepo } from "@/repositories/followRepo";
import { NotificationRepo } from "@/repositories/notificationRepo";

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

export const NotificationService = {
  async notifyFollowersOfIssue(issueId: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, slug: true, status: true, tags: true, title: true }
    });

    if (!issue || issue.status !== "PUBLISHED") {
      return { notified: 0, reason: "not_published" as const };
    }

    const tags = parseTags(issue.tags);
    const userIds = await FollowRepo.listUserFollowersForTags(tags);
    if (userIds.length === 0) {
      return { notified: 0, reason: "no_followers" as const };
    }

    await NotificationRepo.createMany({
      userIds,
      type: "NEW_ISSUE_IN_TAG",
      payload: {
        issueId: issue.id,
        slug: issue.slug,
        title: issue.title,
        tags
      }
    });

    logger.info("notifications.issue_published", {
      issueId: issue.id,
      notified: userIds.length
    });

    return { notified: userIds.length, reason: "ok" as const };
  },

  async notifyTrendSpike(input: { issueId: string; trendScore: number; delta: number; dateKey: string }) {
    const { prisma } = await import("@/lib/db/prisma");
    const issue = await prisma.issue.findUnique({
      where: { id: input.issueId },
      select: { id: true, slug: true, status: true, tags: true, title: true }
    });

    if (!issue || issue.status !== "PUBLISHED") {
      return { notified: 0, reason: "not_published" as const };
    }

    const tags = parseTags(issue.tags);
    const userIds = await FollowRepo.listUserFollowersForTags(tags);
    if (userIds.length === 0) {
      return { notified: 0, reason: "no_followers" as const };
    }

    await NotificationRepo.createMany({
      userIds,
      type: "TREND_SPIKE",
      payload: {
        issueId: issue.id,
        slug: issue.slug,
        title: issue.title,
        tags,
        dateKey: input.dateKey,
        trendScore: input.trendScore,
        delta: input.delta
      }
    });

    logger.info("notifications.trend_spike", {
      issueId: issue.id,
      notified: userIds.length,
      trendScore: input.trendScore,
      delta: input.delta,
      dateKey: input.dateKey
    });

    return { notified: userIds.length, reason: "ok" as const };
  }
};

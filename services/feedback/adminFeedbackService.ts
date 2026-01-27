import { FeedbackRepo } from "@/repositories/feedbackRepo";
import { logger } from "@/lib/log";

export async function listRecentFeedback(limit = 60) {
  try {
    return await FeedbackRepo.listRecentFeedback(limit);
  } catch (err) {
    logger.error("admin_feedback.list_recent_failed", err);
    return [] as Awaited<ReturnType<typeof FeedbackRepo.listRecentFeedback>>;
  }
}

export async function listFeedbackSummary(limit = 20) {
  try {
    return await FeedbackRepo.listIssueFeedbackSummary(limit);
  } catch (err) {
    logger.error("admin_feedback.summary_failed", err);
    return [] as Awaited<ReturnType<typeof FeedbackRepo.listIssueFeedbackSummary>>;
  }
}

import { logger } from "@/lib/log";
import { QualityRepo } from "@/repositories/qualityRepo";
import { QualityService } from "@/services/dq/qualityService";

export interface NightlyQualityJobResult {
  checked: number;
  succeeded: number;
  failed: number;
  blocked: number;
}

export async function runNightlyQualityJob(): Promise<NightlyQualityJobResult> {
  const issueIds = await QualityRepo.listPublishedIssueIds(120);
  if (issueIds.length === 0) {
    logger.info("nightly_quality.no_published_issues");
    return { checked: 0, succeeded: 0, failed: 0, blocked: 0 };
  }

  let succeeded = 0;
  let failed = 0;
  let blocked = 0;

  for (const issueId of issueIds) {
    try {
      const result = await QualityService.runAndStore(issueId, "NIGHTLY");
      succeeded += 1;
      if (result.evaluation.action === "BLOCK_PUBLISH") blocked += 1;
    } catch (err) {
      failed += 1;
      logger.error("nightly_quality.issue_failed", err, { issueId });
    }
  }

  const summary = { checked: issueIds.length, succeeded, failed, blocked };
  logger.info("nightly_quality.completed", summary);
  return summary;
}

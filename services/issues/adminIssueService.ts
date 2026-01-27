import { logger } from "@/lib/log";
import { IssueRepo } from "@/repositories/issueRepo";

export async function listAdminIssues(status: "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED") {
  try {
    return await IssueRepo.list({ status, take: 50 });
  } catch (err) {
    logger.warn("admin_issue_service.list_failed", {
      status,
      error: err instanceof Error ? err.message : String(err)
    });
    return [];
  }
}

export async function getAdminIssueById(id: string) {
  try {
    return await IssueRepo.getById(id);
  } catch (err) {
    logger.warn("admin_issue_service.get_failed", {
      id,
      error: err instanceof Error ? err.message : String(err)
    });
    return null;
  }
}

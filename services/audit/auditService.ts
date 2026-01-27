import { logger } from "@/lib/log";
import { AuditLogRepo } from "@/repositories/auditLogRepo";

export const AuditService = {
  async record(input: {
    action: string;
    entityType: string;
    entityId: string;
    issueId?: string | null;
    actorAdminId?: string | null;
    before?: unknown;
    after?: unknown;
    note?: string | null;
  }) {
    try {
      await AuditLogRepo.create(input);
    } catch (err) {
      logger.warn("audit.record_failed", {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
};

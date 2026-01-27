import { prisma } from "@/lib/db/prisma";

export interface AuditLogInput {
  actorAdminId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  issueId?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string | null;
}

function toJson(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ unsafe: String(value) });
  }
}

export const AuditLogRepo = {
  async create(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        actorAdminId: input.actorAdminId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        issueId: input.issueId ?? null,
        beforeJson: toJson(input.before),
        afterJson: toJson(input.after),
        note: input.note ?? null
      }
    });
  },

  async listRecent(take = 50) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take
    });
  }
};

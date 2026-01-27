function serializePayload(payload: Record<string, unknown> | null | undefined) {
  if (!payload) return null;
  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}

function parsePayload(payloadJson: string | null) {
  if (!payloadJson) return null;
  try {
    return JSON.parse(payloadJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export const NotificationRepo = {
  async createMany(input: { userIds: string[]; type: string; payload?: Record<string, unknown> }) {
    if (input.userIds.length === 0) return { count: 0 };
    const { prisma } = await import("@/lib/db/prisma");
    const payloadJson = serializePayload(input.payload);
    return prisma.notification.createMany({
      data: input.userIds.map((userId) => ({
        userId,
        type: input.type,
        payloadJson
      }))
    });
  },

  async listForUser(userId: string, take = 40) {
    const { prisma } = await import("@/lib/db/prisma");
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take
    });
    return rows.map((row) => ({ ...row, payload: parsePayload(row.payloadJson) }));
  },

  async countUnread(userId: string) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.notification.count({ where: { userId, readAt: null } });
  },

  async markRead(userId: string, id: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const existing = await prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) return null;
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    });
  }
};

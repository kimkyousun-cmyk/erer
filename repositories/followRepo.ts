function normalizeTag(tag: string) {
  return tag.trim().toLowerCase().slice(0, 40);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export const FollowRepo = {
  normalizeTag,

  async listFollowedTags(input: { sessionHash?: string | null; userId?: string | null }) {
    const { prisma } = await import("@/lib/db/prisma");
    const where = {
      OR: [input.sessionHash ? { sessionHash: input.sessionHash } : null, input.userId ? { userId: input.userId } : null].filter(
        Boolean
      ) as Array<{ sessionHash?: string; userId?: string }>
    };

    if (where.OR.length === 0) return [] as string[];

    const follows = await prisma.followTag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { tag: true }
    });
    return unique(follows.map((f) => f.tag));
  },

  async followTag(input: { tag: string; sessionHash?: string | null; userId?: string | null }) {
    const { prisma } = await import("@/lib/db/prisma");
    const tag = normalizeTag(input.tag);
    if (!tag) throw new Error("Invalid tag");

    const created: Array<{ id: string }> = [];

    if (input.sessionHash) {
      await prisma.followTag.deleteMany({ where: { sessionHash: input.sessionHash, tag } });
      const row = await prisma.followTag.create({ data: { sessionHash: input.sessionHash, tag } });
      created.push(row);
    }

    if (input.userId) {
      await prisma.followTag.deleteMany({ where: { userId: input.userId, tag } });
      const row = await prisma.followTag.create({ data: { userId: input.userId, tag } });
      created.push(row);
    }

    return created;
  },

  async unfollowTag(input: { tag: string; sessionHash?: string | null; userId?: string | null }) {
    const { prisma } = await import("@/lib/db/prisma");
    const tag = normalizeTag(input.tag);
    if (!tag) return 0;
    const res = await prisma.followTag.deleteMany({
      where: {
        tag,
        OR: [input.sessionHash ? { sessionHash: input.sessionHash } : null, input.userId ? { userId: input.userId } : null].filter(
          Boolean
        ) as Array<{ sessionHash?: string; userId?: string }>
      }
    });
    return res.count;
  },

  async listUserFollowersForTags(tags: string[]) {
    if (tags.length === 0) return [] as string[];
    const { prisma } = await import("@/lib/db/prisma");
    const normalized = unique(tags.map(normalizeTag).filter(Boolean));
    if (normalized.length === 0) return [] as string[];

    const rows = await prisma.followTag.findMany({
      where: {
        tag: { in: normalized },
        userId: { not: null }
      },
      select: { userId: true }
    });

    return unique(rows.map((r) => r.userId).filter((id): id is string => Boolean(id)));
  }
};

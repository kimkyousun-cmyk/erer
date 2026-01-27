import type { Issue } from "@prisma/client";

export interface SearchQuery {
  query: string;
  take: number;
  skip: number;
}

export const SearchRepo = {
  async searchPublished({ query, take, skip }: SearchQuery): Promise<Issue[]> {
    const { prisma } = await import("@/lib/db/prisma");

    // LIKE-based fallback search. This keeps us DB-provider neutral while
    // we prepare FTS tables in a later migration.
    return prisma.issue.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query } },
          { contextSummary: { contains: query } },
          { verdictLine: { contains: query } },
          { tags: { contains: query } }
        ]
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take,
      skip
    });
  }
};

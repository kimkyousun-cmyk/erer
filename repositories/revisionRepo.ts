export const RevisionRepo = {
  async createRevision(input: {
    issueId: string;
    fromVersion: number;
    toVersion: number;
    diffSummary: string;
    editorAdminId?: string | null;
  }) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.issueRevision.create({
      data: {
        issueId: input.issueId,
        fromVersion: input.fromVersion,
        toVersion: input.toVersion,
        diffSummary: input.diffSummary.slice(0, 200),
        editorAdminId: input.editorAdminId ?? null
      }
    });
  }
};

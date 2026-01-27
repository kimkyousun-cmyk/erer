import { prisma } from "@/lib/db/prisma";

export const ShortsJobRepo = {
  async getById(id: string) {
    return prisma.shortsJob.findUnique({ where: { id } });
  },

  async latestForIssue(issueId: string) {
    return prisma.shortsJob.findFirst({
      where: { issueId },
      orderBy: { createdAt: "desc" }
    });
  },

  async createQueued(input: { issueId: string; webhookUrl?: string | null }) {
    return prisma.shortsJob.create({
      data: {
        issueId: input.issueId,
        status: "QUEUED",
        webhookUrl: input.webhookUrl ?? null
      }
    });
  },

  async markRunning(id: string, externalRunId?: string | null) {
    return prisma.shortsJob.update({
      where: { id },
      data: {
        status: "RUNNING",
        externalRunId: externalRunId ?? undefined,
        lastHeartbeatAt: new Date()
      }
    });
  },

  async markSucceeded(input: {
    id: string;
    externalRunId?: string | null;
    resultVideoUrl?: string | null;
    resultAssetsJson?: string | null;
  }) {
    return prisma.shortsJob.update({
      where: { id: input.id },
      data: {
        status: "SUCCEEDED",
        externalRunId: input.externalRunId ?? undefined,
        resultVideoUrl: input.resultVideoUrl ?? undefined,
        resultAssetsJson: input.resultAssetsJson ?? undefined,
        errorMessage: null,
        lastHeartbeatAt: new Date()
      }
    });
  },

  async markFailed(input: { id: string; externalRunId?: string | null; errorMessage: string }) {
    return prisma.shortsJob.update({
      where: { id: input.id },
      data: {
        status: "FAILED",
        externalRunId: input.externalRunId ?? undefined,
        errorMessage: input.errorMessage.slice(0, 400),
        lastHeartbeatAt: new Date()
      }
    });
  },

  async updateHeartbeat(id: string) {
    return prisma.shortsJob.update({
      where: { id },
      data: { lastHeartbeatAt: new Date() }
    });
  }
};

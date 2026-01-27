import { prisma } from "@/lib/db/prisma";

export const JobRunRepo = {
  async start(jobName: string, meta?: Record<string, unknown>) {
    return prisma.jobRun.create({
      data: {
        jobName,
        status: "RUNNING",
        metaJson: meta ? JSON.stringify(meta) : null
      }
    });
  },

  async succeed(id: string, meta?: Record<string, unknown>) {
    return prisma.jobRun.update({
      where: { id },
      data: {
        status: "SUCCEEDED",
        finishedAt: new Date(),
        metaJson: meta ? JSON.stringify(meta) : undefined
      }
    });
  },

  async fail(id: string, errorMessage: string, meta?: Record<string, unknown>) {
    return prisma.jobRun.update({
      where: { id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage,
        metaJson: meta ? JSON.stringify(meta) : undefined
      }
    });
  },

  async listRecent(jobName?: string, take = 30) {
    return prisma.jobRun.findMany({
      where: jobName ? { jobName } : undefined,
      orderBy: { startedAt: "desc" },
      take
    });
  }
};

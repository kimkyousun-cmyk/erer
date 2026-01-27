function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

export interface VariantMetrics {
  variantName: string;
  exposures: number;
  opens: number;
  shares: number;
  votes: number;
}

export const ExperimentMetricsRepo = {
  async getVariantMetrics(experimentKey: string, windowDays = 14): Promise<VariantMetrics[]> {
    const { prisma } = await import("@/lib/db/prisma");
    const experiment = await prisma.experiment.findUnique({ where: { key: experimentKey } });
    if (!experiment) return [];

    const since = daysAgo(windowDays);

    const assignments = await prisma.assignment.findMany({
      where: { experimentId: experiment.id },
      select: { sessionHash: true, variantName: true, assignedAt: true }
    });
    if (assignments.length === 0) return [];

    const sessionHashes = assignments.map((a) => a.sessionHash);
    const events = await prisma.event.findMany({
      where: {
        sessionHash: { in: sessionHashes },
        createdAt: { gte: since }
      },
      select: {
        sessionHash: true,
        eventName: true,
        createdAt: true
      }
    });

    const assignmentBySession = new Map(assignments.map((a) => [a.sessionHash, a]));
    const metrics = new Map<string, VariantMetrics>();

    function getMetric(variantName: string) {
      const existing = metrics.get(variantName);
      if (existing) return existing;
      const next: VariantMetrics = {
        variantName,
        exposures: 0,
        opens: 0,
        shares: 0,
        votes: 0
      };
      metrics.set(variantName, next);
      return next;
    }

    for (const event of events) {
      const assignment = assignmentBySession.get(event.sessionHash);
      if (!assignment) continue;
      if (event.createdAt < assignment.assignedAt) continue;
      const metric = getMetric(assignment.variantName);
      if (event.eventName === "EXPERIMENT_EXPOSURE") metric.exposures += 1;
      if (event.eventName === "ISSUE_OPEN") metric.opens += 1;
      if (event.eventName === "SHARE_CLICK") metric.shares += 1;
      if (event.eventName === "VOTE_SUBMIT") metric.votes += 1;
    }

    return Array.from(metrics.values()).sort((a, b) => b.exposures - a.exposures);
  }
};

import { ExperimentRepo } from "@/repositories/experimentRepo";
import { ExperimentMetricsRepo } from "@/repositories/experimentMetricsRepo";
import { logger } from "@/lib/log";

export async function listExperimentsWithMetrics() {
  try {
    const experiments = await ExperimentRepo.listExperiments();
    const enriched = await Promise.all(
      experiments.map(async (exp) => {
        const metrics = await ExperimentMetricsRepo.getVariantMetrics(exp.key, 14);
        return { ...exp, metrics };
      })
    );
    return enriched;
  } catch (err) {
    logger.error("admin_experiments.list_failed", err);
    return [] as Awaited<ReturnType<typeof listExperimentsWithMetrics>>;
  }
}

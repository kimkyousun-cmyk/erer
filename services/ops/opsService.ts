import { getPanicSwitches } from "@/lib/panic";
import { isDemoMode } from "@/lib/demo";
import { JobRunRepo } from "@/repositories/jobRunRepo";
import { logger } from "@/lib/log";

function sinceHours(hours: number) {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - hours);
  return d;
}

export async function getOpsSnapshot() {
  const panic = getPanicSwitches();

  if (isDemoMode()) {
    return {
      panic,
      mode: "demo" as const,
      runs: [],
      last24h: {
        total: 0,
        failures: 0,
        failureRate: 0
      }
    };
  }

  try {
    const runs = await JobRunRepo.listRecent(undefined, 80);
    const since24h = sinceHours(24);
    const last24h = runs.filter((r) => r.startedAt >= since24h);
    const failures24h = last24h.filter((r) => r.status === "FAILED");

    const failureRate = last24h.length === 0 ? 0 : failures24h.length / last24h.length;

    return {
      panic,
      runs,
      last24h: {
        total: last24h.length,
        failures: failures24h.length,
        failureRate
      }
    };
  } catch (err) {
    logger.error("ops.snapshot_failed", err);
    return {
      panic,
      runs: [] as Awaited<ReturnType<typeof JobRunRepo.listRecent>>,
      last24h: {
        total: 0,
        failures: 0,
        failureRate: 0
      }
    };
  }
}

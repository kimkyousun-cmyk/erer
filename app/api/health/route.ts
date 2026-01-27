import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { getPanicSwitches } from "@/lib/panic";
import { JobRunRepo } from "@/repositories/jobRunRepo";

export const dynamic = "force-dynamic";

function hoursAgo(date: Date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

async function checkDb() {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const, error: null };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

async function checkJobFreshness(jobName: string, maxHours: number) {
  try {
    const last = (await JobRunRepo.listRecent(jobName, 1))[0];
    if (!last) {
      return { jobName, ok: false, reason: "no_runs" as const, lastRunAt: null, status: null, stale: true };
    }
    const lastAt = last.finishedAt ?? last.startedAt;
    const ageHours = hoursAgo(lastAt);
    const stale = ageHours > maxHours;
    return {
      jobName,
      ok: !stale,
      reason: stale ? ("stale" as const) : ("fresh" as const),
      lastRunAt: lastAt.toISOString(),
      status: last.status,
      stale,
      ageHours: Math.round(ageHours * 10) / 10
    };
  } catch (err) {
    return {
      jobName,
      ok: false,
      reason: "error" as const,
      error: err instanceof Error ? err.message : String(err),
      lastRunAt: null,
      status: null,
      stale: true
    };
  }
}

export async function GET() {
  const panic = getPanicSwitches();

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      service: "emotion-radar",
      mode: "demo",
      time: new Date().toISOString(),
      db: {
        ok: true,
        skipped: true,
        reason: "DEMO_MODE"
      },
      jobs: [],
      panic
    });
  }

  const [db, hourlyDraft, hourlyTrend, dailyRadar, nightlyQuality] = await Promise.all([
    checkDb(),
    checkJobFreshness("HourlyIssueDraftJob", 4),
    checkJobFreshness("HourlyTrendAggregationJob", 4),
    checkJobFreshness("DailyRadarJob", 30),
    checkJobFreshness("NightlyQualityJob", 36)
  ]);

  const jobs = [hourlyDraft, hourlyTrend, dailyRadar, nightlyQuality];
  const jobsOk = jobs.every((j) => j.ok);

  const ok = db.ok && jobsOk;

  return NextResponse.json({
    ok,
    service: "emotion-radar",
    time: new Date().toISOString(),
    db,
    jobs,
    panic
  });
}

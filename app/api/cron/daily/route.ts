import { NextResponse } from "next/server";
import { runDailyRadarJob } from "@/jobs/dailyRadarJob";
import { runNightlyQualityJob } from "@/jobs/nightlyQualityJob";
import { logger } from "@/lib/log";
import { createRequestId } from "@/lib/requestId";
import { cronHeaderName, verifyCronSecret } from "@/lib/security/cronAuth";
import { runJob } from "@/services/jobs/jobRunner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const auth = verifyCronSecret(request.headers);

  if (!auth.ok) {
    logger.warn("cron.daily.unauthorized", { requestId, reason: auth.reason });
    return NextResponse.json(
      {
        error: "Unauthorized",
        reason: auth.reason,
        requestId,
        expectedHeader: cronHeaderName
      },
      { status: 401 }
    );
  }

  try {
    const dailyRadarResult = await runJob("DailyRadarJob", () => runDailyRadarJob(), {
      retries: 3,
      baseDelayMs: 800,
      meta: { requestId }
    });

    const nightlyQualityResult = await runJob(
      "NightlyQualityJob",
      () => runNightlyQualityJob(),
      {
        retries: 2,
        baseDelayMs: 500,
        meta: { requestId }
      }
    );

    return NextResponse.json({ ok: true, requestId, dailyRadarResult, nightlyQualityResult });
  } catch (err) {
    logger.error("cron.daily.failed", err, { requestId });
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Daily job failed"
      },
      { status: 500 }
    );
  }
}

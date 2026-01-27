import { NextResponse } from "next/server";
import { runHourlyIssueDraftJob } from "@/jobs/hourlyIssueDraftJob";
import { runHourlyTrendAggregationJob } from "@/jobs/hourlyTrendAggregationJob";
import { logger } from "@/lib/log";
import { createRequestId } from "@/lib/requestId";
import { cronHeaderName, verifyCronSecret } from "@/lib/security/cronAuth";
import { runJob } from "@/services/jobs/jobRunner";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const auth = verifyCronSecret(request.headers);

  if (!auth.ok) {
    logger.warn("cron.hourly.unauthorized", { requestId, reason: auth.reason });
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
    const draftResult = await runJob("HourlyIssueDraftJob", () => runHourlyIssueDraftJob(), {
      retries: 3,
      baseDelayMs: 600,
      meta: { requestId }
    });

    const trendResult = await runJob(
      "HourlyTrendAggregationJob",
      () => runHourlyTrendAggregationJob(),
      {
        retries: 2,
        baseDelayMs: 400,
        meta: { requestId }
      }
    );

    return NextResponse.json({ ok: true, requestId, draftResult, trendResult });
  } catch (err) {
    logger.error("cron.hourly.failed", err, { requestId });
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Hourly job failed"
      },
      { status: 500 }
    );
  }
}

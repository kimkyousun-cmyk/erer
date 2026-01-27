import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { authorizePublicApi } from "@/services/api/publicApiAuth";
import { getDailyRadarView } from "@/services/daily/dailyRadarService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const auth = await authorizePublicApi(request.headers);

  if (auth.rateLimited) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: auth.retryAfterSeconds ?? 60 },
      { status: 429 }
    );
  }

  if (auth.plan && auth.plan !== "PRO") {
    return NextResponse.json({ error: "API access requires PRO", requestId }, { status: 403 });
  }

  const view = await getDailyRadarView();
  return NextResponse.json({ requestId, tier: auth.tier, daily: view });
}

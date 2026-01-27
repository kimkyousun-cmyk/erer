import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { requireFeature } from "@/services/featureGateService";
import { defaultWeekKey, generateWeeklyReport } from "@/services/reports/weeklyReportService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const gate = await requireFeature("WEEKLY_REPORT");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason ?? "Forbidden", plan: gate.plan, requestId }, { status: 403 });
  }

  const url = new URL(request.url);
  const week = url.searchParams.get("week") ?? defaultWeekKey();
  const report = await generateWeeklyReport(week);

  return NextResponse.json({ requestId, week, report });
}

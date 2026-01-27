import { NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { createRequestId } from "@/lib/requestId";
import { getPanicSwitches } from "@/lib/panic";
import { requireFeature } from "@/services/featureGateService";
import { generateShortsPackageFromIssue } from "@/services/shorts/shortsPackageService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const limit = tokenBucket(`shorts:issue:${ip}`, rateLimitConfigs.shortsExport);
  const panic = getPanicSwitches();

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  if (panic.disableExports || panic.readOnlyMode) {
    return NextResponse.json(
      { error: "Exports temporarily disabled", requestId },
      { status: 503 }
    );
  }

  try {
    const gate = await requireFeature("EXPORT_SHORTS_PACKAGE", { incrementUsage: true });
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.reason ?? "Forbidden", plan: gate.plan, requestId },
        { status: 403 }
      );
    }

    const pkg = await generateShortsPackageFromIssue(context.params.id);
    return NextResponse.json({ ok: true, requestId, package: pkg });
  } catch (err) {
    logger.warn("shorts.package_issue_failed", {
      requestId,
      issueId: context.params.id,
      error: err instanceof Error ? err.message : String(err)
    });
    const message = err instanceof Error ? err.message : "Shorts package failed";
    return NextResponse.json({ ok: false, requestId, error: message }, { status: 400 });
  }
}

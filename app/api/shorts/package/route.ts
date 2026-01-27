import { NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { createRequestId } from "@/lib/requestId";
import { shortsPackageRequestSchema } from "@/lib/validation/shortsRequest";
import { requireFeature } from "@/services/featureGateService";
import {
  generateShortsPackageFromIssue,
  generateShortsPackageFromSeed
} from "@/services/shorts/shortsPackageService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const limit = tokenBucket(`shorts:package:${ip}`, rateLimitConfigs.shortsExport);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 }
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

    const json = (await request.json()) as unknown;
    const parsed = shortsPackageRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request", requestId },
        { status: 400 }
      );
    }

    const pkg = parsed.data.issueId
      ? await generateShortsPackageFromIssue(parsed.data.issueId)
      : await generateShortsPackageFromSeed(parsed.data.seedText ?? "");

    return NextResponse.json({ ok: true, requestId, package: pkg });
  } catch (err) {
    logger.warn("shorts.package_failed", {
      requestId,
      error: err instanceof Error ? err.message : String(err)
    });
    const message = err instanceof Error ? err.message : "Shorts package failed";
    return NextResponse.json({ ok: false, requestId, error: message }, { status: 400 });
  }
}

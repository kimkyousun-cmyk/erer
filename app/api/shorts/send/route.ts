import { NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { createRequestId } from "@/lib/requestId";
import { idempotencyKey } from "@/lib/security/idempotency";
import { getPanicSwitches } from "@/lib/panic";
import { shortsSendSchema } from "@/lib/validation/shortsSend";
import { AppSettingRepo } from "@/repositories/appSettingRepo";
import { ShortsJobRepo } from "@/repositories/shortsJobRepo";
import { AuditService } from "@/services/audit/auditService";
import { requireFeature } from "@/services/featureGateService";
import { generateShortsPackageFromIssue } from "@/services/shorts/shortsPackageService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const limit = tokenBucket(`shorts:send:${ip}`, rateLimitConfigs.shortsExport);
  const panic = getPanicSwitches();

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  if (panic.disableExports || panic.disableWebhooks || panic.readOnlyMode) {
    return NextResponse.json(
      { error: "Shorts export temporarily disabled", requestId },
      { status: 503 }
    );
  }

  const settings = await AppSettingRepo.ensure();
  if (!settings.n8nWebhookUrl) {
    return NextResponse.json(
      { error: "n8n webhook URL is not configured", requestId },
      { status: 400 }
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
    const parsed = shortsSendSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request", requestId },
        { status: 400 }
      );
    }

    const pkg = await generateShortsPackageFromIssue(parsed.data.issueId);
    const job = await ShortsJobRepo.createQueued({
      issueId: parsed.data.issueId,
      webhookUrl: settings.n8nWebhookUrl
    });

    const idemKey = idempotencyKey("shorts", parsed.data.issueId);

    try {
      const res = await fetch(settings.n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idemKey,
          "X-Webhook-Secret": settings.shortsWebhookSecret
        },
        body: JSON.stringify({
          requestId,
          idempotencyKey: idemKey,
          issueId: parsed.data.issueId,
          shortsPackage: pkg,
          jobId: job.id
        })
      });

      const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const externalRunId = typeof payload.runId === "string" ? payload.runId : typeof payload.externalRunId === "string" ? payload.externalRunId : null;

      if (!res.ok) {
        await ShortsJobRepo.markFailed({
          id: job.id,
          externalRunId,
          errorMessage: `Webhook responded ${res.status}`
        });

        return NextResponse.json(
          { error: "Webhook rejected the request", requestId, jobId: job.id },
          { status: 502 }
        );
      }

      await ShortsJobRepo.markRunning(job.id, externalRunId);

      await AuditService.record({
        action: "SHORTS_TRIGGER",
        entityType: "ShortsJob",
        entityId: job.id,
        issueId: parsed.data.issueId,
        after: {
          jobId: job.id,
          externalRunId,
          idempotencyKey: idemKey
        }
      });

      return NextResponse.json({ ok: true, requestId, jobId: job.id, externalRunId });
    } catch (err) {
      await ShortsJobRepo.markFailed({
        id: job.id,
        errorMessage: err instanceof Error ? err.message : "Webhook send failed"
      });
      logger.error("shorts.send_failed", err, { requestId, jobId: job.id });

      return NextResponse.json(
        {
          ok: false,
          requestId,
          jobId: job.id,
          error: "Webhook send failed"
        },
        { status: 502 }
      );
    }
  } catch (err) {
    logger.error("shorts.send_unexpected", err, { requestId });
    return NextResponse.json({ error: "Shorts send failed", requestId }, { status: 500 });
  }
}

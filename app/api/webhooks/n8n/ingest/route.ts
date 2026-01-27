import { NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { createRequestId } from "@/lib/requestId";
import { getPanicSwitches } from "@/lib/panic";
import { n8nWebhookSchema } from "@/lib/validation/n8nWebhook";
import { AppSettingRepo } from "@/repositories/appSettingRepo";
import { ShortsJobRepo } from "@/repositories/shortsJobRepo";
import { AuditService } from "@/services/audit/auditService";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const limit = tokenBucket(`webhook:n8n:${ip}`, rateLimitConfigs.webhookIngest);
  const panic = getPanicSwitches();

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429 }
    );
  }

  if (panic.disableWebhooks || panic.readOnlyMode) {
    return NextResponse.json({ error: "Webhooks temporarily disabled", requestId }, { status: 503 });
  }

  const settings = await AppSettingRepo.ensure();
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== settings.shortsWebhookSecret) {
    logger.warn("n8n_webhook.unauthorized", { requestId });
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 });
  }

  try {
    const json = (await request.json()) as unknown;
    const parsed = n8nWebhookSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload", requestId },
        { status: 400 }
      );
    }

    const payload = parsed.data;
    const job = payload.jobId
      ? await ShortsJobRepo.getById(payload.jobId)
      : await ShortsJobRepo.latestForIssue(payload.issueId);

    if (!job) {
      return NextResponse.json({ error: "Shorts job not found", requestId }, { status: 404 });
    }
    if (job.issueId !== payload.issueId) {
      return NextResponse.json({ error: "Job does not match issue", requestId }, { status: 400 });
    }

    if (payload.status === "RUNNING" || payload.status === "QUEUED") {
      await ShortsJobRepo.markRunning(job.id, payload.externalRunId ?? null);
    } else if (payload.status === "SUCCEEDED") {
      await ShortsJobRepo.markSucceeded({
        id: job.id,
        externalRunId: payload.externalRunId ?? null,
        resultVideoUrl: payload.resultVideoUrl ?? null,
        resultAssetsJson: payload.assets ? JSON.stringify(payload.assets) : null
      });
    } else if (payload.status === "FAILED") {
      await ShortsJobRepo.markFailed({
        id: job.id,
        externalRunId: payload.externalRunId ?? null,
        errorMessage: payload.error ?? "Shorts pipeline failed"
      });
    }

    await AuditService.record({
      action: "SHORTS_WEBHOOK_UPDATE",
      entityType: "ShortsJob",
      entityId: job.id,
      issueId: payload.issueId,
      after: {
        status: payload.status,
        externalRunId: payload.externalRunId ?? null,
        resultVideoUrl: payload.resultVideoUrl ?? null
      }
    });

    return NextResponse.json({ ok: true, requestId, jobId: job.id });
  } catch (err) {
    logger.error("n8n_webhook.failed", err, { requestId });
    return NextResponse.json({ error: "Webhook ingest failed", requestId }, { status: 500 });
  }
}

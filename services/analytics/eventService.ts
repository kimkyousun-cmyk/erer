import { rateLimitConfigs, tokenBucket } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { getSessionHash } from "@/lib/security/session";
import { logger } from "@/lib/log";
import { isDemoMode } from "@/lib/demo";
import { trackEventInputSchema, type TrackEventInput } from "@/lib/validation/event";
import { EventRepo } from "@/repositories/eventRepo";

function parseDelimitedTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
}

async function resolvePublishedIssue(issueId: string) {
  const { prisma } = await import("@/lib/db/prisma");
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      status: true,
      tags: true
    }
  });

  if (!issue || issue.status !== "PUBLISHED") {
    return null;
  }

  return issue;
}

export interface IngestEventContext {
  headers: Headers;
  requestId: string;
  userId?: string | null;
}

export interface IngestEventResult {
  ok: boolean;
  status: number;
  code: string;
  message: string;
}

export const EventService = {
  async ingest(ctx: IngestEventContext, input: unknown): Promise<IngestEventResult> {
    const ip = getRequestIp(ctx.headers);
    const decision = tokenBucket(`event:${ip}`, rateLimitConfigs.eventIngest);

    if (!decision.allowed) {
      return {
        ok: false,
        status: 429,
        code: "RATE_LIMITED",
        message: `Too many events. Retry in ${decision.retryAfterSeconds}s.`
      };
    }

    const parsed = trackEventInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        status: 400,
        code: "INVALID_EVENT",
        message: "Event payload failed validation."
      };
    }

    const payload: TrackEventInput = parsed.data;
    const sessionHash = getSessionHash();

    if (isDemoMode()) {
      return {
        ok: true,
        status: 200,
        code: "DEMO_MODE",
        message: "Event skipped in demo mode."
      };
    }

    let issueId: string | undefined = payload.issueId;
    let tags = payload.tags;

    if (issueId) {
      try {
        const issue = await resolvePublishedIssue(issueId);
        if (!issue) {
          issueId = undefined;
        } else if (!tags || tags.length === 0) {
          tags = parseDelimitedTags(issue.tags);
        }
      } catch (err) {
        logger.warn("event.issue_lookup_failed", {
          requestId: ctx.requestId,
          issueId,
          err: err instanceof Error ? err.message : String(err)
        });
        issueId = undefined;
      }
    }

    try {
      await EventRepo.createEvent({
        sessionHash,
        userId: ctx.userId ?? null,
        eventName: payload.eventName,
        issueId,
        tags,
        metadata: payload.metadata
      });

      logger.info("event.ingested", {
        requestId: ctx.requestId,
        eventName: payload.eventName,
        hasIssueId: Boolean(issueId)
      });

      return {
        ok: true,
        status: 200,
        code: "OK",
        message: "Event recorded."
      };
    } catch (err) {
      logger.error("event.ingest_failed", err, {
        requestId: ctx.requestId,
        eventName: payload.eventName
      });
      return {
        ok: false,
        status: 500,
        code: "EVENT_WRITE_FAILED",
        message: "Failed to record event."
      };
    }
  }
};

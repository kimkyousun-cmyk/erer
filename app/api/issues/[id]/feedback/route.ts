import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { getRequestIp } from "@/lib/request";
import { rateLimitConfigs, tokenBucket } from "@/lib/rateLimit";
import { getSessionHash } from "@/lib/security/session";
import { feedbackInputSchema } from "@/lib/validation/feedback";
import { FeedbackRepo } from "@/repositories/feedbackRepo";
import { logger } from "@/lib/log";

export const runtime = "nodejs";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const decision = tokenBucket(`feedback:${ip}`, rateLimitConfigs.feedbackSubmit);

  if (!decision.allowed) {
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message: `Too many feedback submissions. Retry in ${decision.retryAfterSeconds}s.`,
        requestId
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON.",
        requestId
      },
      { status: 400 }
    );
  }

  const parsed = feedbackInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "INVALID_FEEDBACK",
        message: "Feedback payload failed validation.",
        requestId
      },
      { status: 400 }
    );
  }

  try {
    const { prisma } = await import("@/lib/db/prisma");
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      select: { id: true, status: true }
    });

    if (!issue || issue.status !== "PUBLISHED") {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: "Issue not found.",
          requestId
        },
        { status: 404 }
      );
    }

    const sessionHash = getSessionHash();
    await FeedbackRepo.createFeedback({
      issueId: issue.id,
      sessionHash,
      type: parsed.data.type,
      note: parsed.data.note
    });

    logger.info("feedback.submitted", {
      requestId,
      issueId: issue.id,
      type: parsed.data.type
    });

    return NextResponse.json({ code: "OK", message: "Feedback recorded.", requestId });
  } catch (err) {
    logger.error("feedback.submit_failed", err, { requestId, issueId: params.id });
    return NextResponse.json(
      {
        code: "FEEDBACK_ERROR",
        message: "Failed to record feedback.",
        requestId
      },
      { status: 500 }
    );
  }
}

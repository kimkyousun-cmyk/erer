import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { getRequestIp } from "@/lib/request";
import { rateLimitConfigs, tokenBucket } from "@/lib/rateLimit";
import { getSessionHash } from "@/lib/security/session";
import { getUserSession } from "@/lib/auth/userSession";
import { isDemoMode } from "@/lib/demo";
import { followInputSchema } from "@/lib/validation/follow";
import { FollowRepo } from "@/repositories/followRepo";
import { logger } from "@/lib/log";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const decision = tokenBucket(`follow:${ip}`, rateLimitConfigs.followAction);

  if (!decision.allowed) {
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message: `Too many follow actions. Retry in ${decision.retryAfterSeconds}s.`,
        requestId
      },
      { status: 429 }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json({ code: "DEMO_MODE", requestId, tags: [] });
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

  const parsed = followInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: "INVALID_FOLLOW",
        message: "Follow payload failed validation.",
        requestId
      },
      { status: 400 }
    );
  }

  const sessionHash = getSessionHash();
  const session = await getUserSession();
  const userId = session?.user.id ?? null;

  try {
    if (parsed.data.action === "follow") {
      await FollowRepo.followTag({ tag: parsed.data.tag, sessionHash, userId });
    } else {
      await FollowRepo.unfollowTag({ tag: parsed.data.tag, sessionHash, userId });
    }

    const tags = await FollowRepo.listFollowedTags({ sessionHash, userId });

    logger.info("follow.action", {
      requestId,
      action: parsed.data.action,
      tag: parsed.data.tag,
      hasUser: Boolean(userId)
    });

    return NextResponse.json({ code: "OK", requestId, tags });
  } catch (err) {
    logger.error("follow.action_failed", err, { requestId, tag: parsed.data.tag });
    return NextResponse.json(
      {
        code: "FOLLOW_ERROR",
        message: "Failed to update follow state.",
        requestId
      },
      { status: 500 }
    );
  }
}

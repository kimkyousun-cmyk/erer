import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { getRequestIp } from "@/lib/request";
import { rateLimitConfigs, tokenBucket } from "@/lib/rateLimit";
import { logger } from "@/lib/log";
import { FeedService } from "@/services/feed/feedService";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const decision = tokenBucket(`feed:${ip}`, rateLimitConfigs.publicApi);

  if (!decision.allowed) {
    return NextResponse.json(
      {
        code: "RATE_LIMITED",
        message: `Too many requests. Retry in ${decision.retryAfterSeconds}s.`,
        requestId
      },
      { status: 429 }
    );
  }

  try {
    const url = new URL(request.url);
    const feed = await FeedService.getFeed(url.searchParams);
    return NextResponse.json({ code: "OK", requestId, feed });
  } catch (err) {
    logger.error("feed.get_failed", err, { requestId });
    return NextResponse.json(
      {
        code: "FEED_ERROR",
        message: "Failed to load feed.",
        requestId
      },
      { status: 500 }
    );
  }
}

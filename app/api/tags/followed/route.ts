import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { createRequestId } from "@/lib/requestId";
import { getRequestIp } from "@/lib/request";
import { rateLimitConfigs, tokenBucket } from "@/lib/rateLimit";
import { getSessionHash } from "@/lib/security/session";
import { getUserSession } from "@/lib/auth/userSession";
import { FollowRepo } from "@/repositories/followRepo";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const decision = tokenBucket(`followed:${ip}`, rateLimitConfigs.publicApi);

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

  if (isDemoMode()) {
    return NextResponse.json({ code: "DEMO_MODE", requestId, tags: [] });
  }

  const sessionHash = getSessionHash();
  const session = await getUserSession();
  const tags = await FollowRepo.listFollowedTags({
    sessionHash,
    userId: session?.user.id ?? null
  });

  return NextResponse.json({ code: "OK", requestId, tags });
}

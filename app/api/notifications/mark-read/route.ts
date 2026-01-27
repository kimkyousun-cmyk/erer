import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { getRequestIp } from "@/lib/request";
import { rateLimitConfigs, tokenBucket } from "@/lib/rateLimit";
import { getUserSession } from "@/lib/auth/userSession";
import { isDemoMode } from "@/lib/demo";
import { NotificationRepo } from "@/repositories/notificationRepo";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const decision = tokenBucket(`notification:${ip}`, rateLimitConfigs.publicApi);

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
    return NextResponse.json({ code: "DEMO_MODE", requestId });
  }

  const session = await getUserSession();
  if (!session) {
    return NextResponse.json(
      {
        code: "UNAUTHORIZED",
        message: "Login required.",
        requestId
      },
      { status: 401 }
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

  const id = typeof (body as { id?: unknown })?.id === "string" ? (body as { id: string }).id : "";
  if (!id) {
    return NextResponse.json(
      {
        code: "INVALID_ID",
        message: "Notification id is required.",
        requestId
      },
      { status: 400 }
    );
  }

  const updated = await NotificationRepo.markRead(session.user.id, id);
  if (!updated) {
    return NextResponse.json(
      {
        code: "NOT_FOUND",
        message: "Notification not found.",
        requestId
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ code: "OK", requestId });
}

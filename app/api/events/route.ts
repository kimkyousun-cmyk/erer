import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { EventService } from "@/services/analytics/eventService";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = createRequestId();

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

  const result = await EventService.ingest(
    {
      headers: request.headers,
      requestId
    },
    body
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.code,
        message: result.message,
        requestId
      },
      { status: result.status }
    );
  }

  return NextResponse.json({ code: "OK", message: "Event recorded.", requestId });
}

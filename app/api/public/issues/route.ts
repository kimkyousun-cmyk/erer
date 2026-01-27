import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { authorizePublicApi } from "@/services/api/publicApiAuth";
import { IssueService } from "@/services/issues/issueService";

export const dynamic = "force-dynamic";

function clampTake(value: number) {
  return Math.max(1, Math.min(50, value));
}

export async function GET(request: Request) {
  const requestId = createRequestId();
  const auth = await authorizePublicApi(request.headers);

  if (auth.rateLimited) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: auth.retryAfterSeconds ?? 60 },
      { status: 429 }
    );
  }

  if (auth.plan && auth.plan !== "PRO") {
    return NextResponse.json(
      { error: "API access requires PRO", requestId },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const take = clampTake(Number.parseInt(url.searchParams.get("take") ?? "20", 10) || 20);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const skip = (page - 1) * take;

  const issues = await IssueService.listIssues({ status: "PUBLISHED", take, skip });

  return NextResponse.json({
    requestId,
    tier: auth.tier,
    page,
    take,
    issues
  });
}

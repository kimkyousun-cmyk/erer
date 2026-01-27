import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/requestId";
import { authorizePublicApi } from "@/services/api/publicApiAuth";
import { IssueService } from "@/services/issues/issueService";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  const requestId = createRequestId();
  const auth = await authorizePublicApi(request.headers);

  if (auth.rateLimited) {
    return NextResponse.json(
      { error: "Rate limited", requestId, retryAfterSeconds: auth.retryAfterSeconds ?? 60 },
      { status: 429 }
    );
  }

  if (auth.plan && auth.plan !== "PRO") {
    return NextResponse.json({ error: "API access requires PRO", requestId }, { status: 403 });
  }

  const issue = await IssueService.getIssueDetailBySlug(context.params.slug);
  if (!issue) {
    return NextResponse.json({ error: "Not found", requestId }, { status: 404 });
  }

  return NextResponse.json({ requestId, tier: auth.tier, issue });
}

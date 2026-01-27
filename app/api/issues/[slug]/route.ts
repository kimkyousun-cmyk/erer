import { NextResponse } from "next/server";
import { getIssueDetail } from "@/services/issueGenerator";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: { slug: string } }
) {
  const issue = getIssueDetail(context.params.slug);
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ issue });
}

import { NextResponse } from "next/server";
import { listIssues } from "@/services/issueGenerator";

export const dynamic = "force-dynamic";

export async function GET() {
  const issues = listIssues();
  return NextResponse.json({ issues });
}

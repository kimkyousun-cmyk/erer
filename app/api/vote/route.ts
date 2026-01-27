import { NextResponse } from "next/server";
import { seedIssues } from "@/data/seedIssues";
import { analyzeEmotions } from "@/services/emotionAnalyzer";
import { applyVote, getVoteState, toCommunityPulse, voteTilt } from "@/lib/voteStore";
import type { VotePayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<VotePayload>;
  if (!body.slug || typeof body.agree !== "boolean" || typeof body.justified !== "boolean") {
    return NextResponse.json({ error: "Invalid vote payload" }, { status: 400 });
  }

  const seed = seedIssues.find((issue) => issue.slug === body.slug);
  if (!seed) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  applyVote(seed.slug, { agree: body.agree, justified: body.justified });
  const state = getVoteState(seed.slug);
  const tilt = voteTilt(state);
  const analysis = analyzeEmotions(seed, {
    velocity: seed.baselineVelocity,
    voteTilt: tilt
  });

  return NextResponse.json({
    slug: seed.slug,
    communityPulse: toCommunityPulse(state),
    adjustedScores: analysis.scores
  });
}

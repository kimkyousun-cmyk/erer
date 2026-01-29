import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isDemoMode } from "@/lib/demo";
import { logger } from "@/lib/log";
import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { createRequestId } from "@/lib/requestId";
import { getSessionHash } from "@/lib/security/session";
import { votePayloadSchema } from "@/lib/validation/vote";
import { applyVote, toCommunityPulse } from "@/lib/voteStore";
import { VoteRepo } from "@/repositories/voteRepo";
import { computeIssueScores, invalidateIssueAggregation } from "@/services/aggregation/issueAggregation";
import { IssueService } from "@/services/issues/issueService";
import { getIssueDetail as getSeedIssueDetail } from "@/services/issueGenerator";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const ip = getRequestIp(request.headers);
  const limit = tokenBucket(`vote:${ip}`, rateLimitConfigs.voteSubmit);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many votes. Please slow down.",
        requestId,
        retryAfterSeconds: limit.retryAfterSeconds
      },
      { status: 429 }
    );
  }

  try {
    const json = (await request.json()) as unknown;
    const parsed = votePayloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid vote payload",
          requestId
        },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      const seed = getSeedIssueDetail(parsed.data.slug);
      if (!seed) {
        return NextResponse.json({ error: "Issue not found", requestId }, { status: 404 });
      }

      const nextState = applyVote(parsed.data.slug, {
        agree: parsed.data.agree,
        justified: parsed.data.justified
      });

      return NextResponse.json({
        slug: parsed.data.slug,
        communityPulse: toCommunityPulse(nextState),
        adjustedScores: seed.scores,
        requestId,
        mode: "demo"
      });
    }

    const issue = await prisma.issue.findUnique({
      where: { slug: parsed.data.slug },
      select: {
        id: true,
        slug: true,
        status: true,
        angerScore: true,
        humorScore: true,
        divisionScore: true
      }
    });

    if (!issue || issue.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Issue not found", requestId }, { status: 404 });
    }

    const sessionHash = getSessionHash();
    await VoteRepo.upsertVote({
      issueId: issue.id,
      sessionHash,
      agree: parsed.data.agree,
      justified: parsed.data.justified
    });

    invalidateIssueAggregation(issue.id);
    const agg = await computeIssueScores(issue);
    IssueService.invalidateIssueCaches(issue.slug);

    return NextResponse.json({
      slug: issue.slug,
      communityPulse: {
        agree: agg.votePulse.agree,
        disagree: agg.votePulse.disagree,
        overreaction: agg.votePulse.overreaction,
        justified: agg.votePulse.justified,
        matrix: agg.votePulse.matrix
      },
      adjustedScores: {
        anger: agg.anger,
        humor: agg.humor,
        division: agg.division
      },
      requestId
    });
  } catch (err) {
    logger.error("vote_api.failed", err, { requestId });
    return NextResponse.json(
      {
        error: "Vote failed",
        requestId
      },
      { status: 500 }
    );
  }
}

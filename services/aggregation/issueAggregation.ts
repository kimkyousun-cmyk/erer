import { clamp, roundScore } from "@/lib/utils";

export interface AggregatedScores {
  anger: number;
  humor: number;
  division: number;
  votePulse: {
    agree: number;
    disagree: number;
    justified: number;
    overreaction: number;
    total: number;
  };
  deltas: {
    anger: number;
    humor: number;
    division: number;
  };
}

function boundedDelta(value: number, maxDelta = 7) {
  return Math.max(-maxDelta, Math.min(maxDelta, value));
}

export interface VoteAggregateInput {
  total: number;
  agree: number;
  disagree: number;
  justified: number;
  overreaction: number;
}

export function applyVoteAggregateToScores(
  base: {
    angerScore: number;
    humorScore: number;
    divisionScore: number;
  },
  agg: VoteAggregateInput
): AggregatedScores {
  const agreeDelta = agg.total === 0 ? 0 : (agg.agree - agg.disagree) / agg.total;
  const justifiedDelta = agg.total === 0 ? 0 : (agg.justified - agg.overreaction) / agg.total;

  // Vote influence is intentionally gentle and bounded to avoid brigading.
  const angerDelta = boundedDelta(justifiedDelta * 7 + agreeDelta * 3);
  const humorDelta = boundedDelta(-justifiedDelta * 3 + (agg.overreaction / Math.max(1, agg.total)) * 2);
  const divisionDelta = boundedDelta(Math.abs(agreeDelta) * 7);

  const anger = roundScore(clamp(base.angerScore + angerDelta, 0, 100));
  const humor = roundScore(clamp(base.humorScore + humorDelta, 0, 100));
  const division = roundScore(clamp(base.divisionScore + divisionDelta, 0, 100));

  return {
    anger,
    humor,
    division,
    votePulse: {
      agree: agg.agree,
      disagree: agg.disagree,
      justified: agg.justified,
      overreaction: agg.overreaction,
      total: agg.total
    },
    deltas: {
      anger: Math.round(angerDelta * 10) / 10,
      humor: Math.round(humorDelta * 10) / 10,
      division: Math.round(divisionDelta * 10) / 10
    }
  };
}

export async function computeIssueScores(issue: {
  id: string;
  angerScore: number;
  humorScore: number;
  divisionScore: number;
}): Promise<AggregatedScores> {
  const { VoteRepo } = await import("@/repositories/voteRepo");
  const agg = await VoteRepo.aggregateByIssue(issue.id);

  return applyVoteAggregateToScores(
    {
      angerScore: issue.angerScore,
      humorScore: issue.humorScore,
      divisionScore: issue.divisionScore
    },
    agg
  );
}

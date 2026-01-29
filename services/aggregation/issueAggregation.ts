import { getCached, invalidateCache, setCached } from "@/lib/cache/simpleCache";
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
    matrix: {
      agreeJustified: number;
      agreeOverreaction: number;
      disagreeJustified: number;
      disagreeOverreaction: number;
    };
  };
  deltas: {
    anger: number;
    humor: number;
    division: number;
  };
}

const AGG_CACHE_PREFIX = "agg:issue:";
const AGG_TTL_SECONDS = 60;

function boundedDelta(value: number, maxDelta = 7) {
  return Math.max(-maxDelta, Math.min(maxDelta, value));
}

export interface VoteAggregateInput {
  total: number;
  agree: number;
  disagree: number;
  justified: number;
  overreaction: number;
  matrix: {
    agreeJustified: number;
    agreeOverreaction: number;
    disagreeJustified: number;
    disagreeOverreaction: number;
  };
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
      total: agg.total,
      matrix: agg.matrix
    },
    deltas: {
      anger: Math.round(angerDelta * 10) / 10,
      humor: Math.round(humorDelta * 10) / 10,
      division: Math.round(divisionDelta * 10) / 10
    }
  };
}

export function invalidateIssueAggregation(issueId?: string) {
  if (issueId) {
    invalidateCache(`${AGG_CACHE_PREFIX}${issueId}`);
    return;
  }
  invalidateCache(AGG_CACHE_PREFIX);
}

export async function computeIssueScores(issue: {
  id: string;
  angerScore: number;
  humorScore: number;
  divisionScore: number;
}): Promise<AggregatedScores> {
  const cacheKey = `${AGG_CACHE_PREFIX}${issue.id}:${issue.angerScore}:${issue.humorScore}:${issue.divisionScore}`;
  const cached = getCached<AggregatedScores>(cacheKey);
  if (cached) return cached;

  const { VoteRepo } = await import("@/repositories/voteRepo");
  const agg = await VoteRepo.aggregateByIssue(issue.id);

  const scored = applyVoteAggregateToScores(
    {
      angerScore: issue.angerScore,
      humorScore: issue.humorScore,
      divisionScore: issue.divisionScore
    },
    agg
  );
  setCached(cacheKey, scored, AGG_TTL_SECONDS);
  return scored;
}

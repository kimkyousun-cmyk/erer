import type { IssueDetail } from "@/lib/types";

interface VoteState {
  agree: number;
  disagree: number;
  overreaction: number;
  justified: number;
}

const DEFAULT_STATE: VoteState = {
  agree: 12,
  disagree: 7,
  overreaction: 9,
  justified: 10
};

// In-memory store is fine for Phase 1 and demo deploys. The interface is
// intentionally tiny so we can swap to Redis/Postgres later without refactors.
const voteStore = new Map<string, VoteState>();

export function getVoteState(slug: string): VoteState {
  return voteStore.get(slug) ?? { ...DEFAULT_STATE };
}

export function applyVote(
  slug: string,
  vote: { agree: boolean; justified: boolean }
): VoteState {
  const current = getVoteState(slug);
  const next: VoteState = { ...current };

  if (vote.agree) next.agree += 1;
  else next.disagree += 1;

  if (vote.justified) next.justified += 1;
  else next.overreaction += 1;

  voteStore.set(slug, next);
  return next;
}

export function voteTilt(state: VoteState): { agreeDelta: number; justifiedDelta: number } {
  const totalAgree = state.agree + state.disagree;
  const totalJustified = state.justified + state.overreaction;

  const agreeDelta = totalAgree === 0 ? 0 : (state.agree - state.disagree) / totalAgree;
  const justifiedDelta =
    totalJustified === 0 ? 0 : (state.justified - state.overreaction) / totalJustified;

  // Clamp to avoid extreme swings from small samples.
  return {
    agreeDelta: Math.max(Math.min(agreeDelta, 0.6), -0.6),
    justifiedDelta: Math.max(Math.min(justifiedDelta, 0.6), -0.6)
  };
}

export function toCommunityPulse(state: VoteState): IssueDetail["communityPulse"] {
  return {
    agree: state.agree,
    disagree: state.disagree,
    overreaction: state.overreaction,
    justified: state.justified
  };
}

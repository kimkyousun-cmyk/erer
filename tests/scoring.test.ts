import test from "node:test";
import assert from "node:assert/strict";
import { applyVoteAggregateToScores } from "@/services/aggregation/issueAggregation";

test("vote deltas are bounded and scores remain within 0..100", () => {
  const result = applyVoteAggregateToScores(
    { angerScore: 95, humorScore: 5, divisionScore: 50 },
    { total: 1000, agree: 1000, disagree: 0, justified: 1000, overreaction: 0 }
  );

  assert.ok(result.deltas.anger <= 7);
  assert.ok(result.deltas.anger >= -7);
  assert.ok(result.anger <= 100);
  assert.ok(result.anger >= 0);
  assert.ok(result.humor <= 100);
  assert.ok(result.division <= 100);
});

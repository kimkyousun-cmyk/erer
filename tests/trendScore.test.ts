import test from "node:test";
import assert from "node:assert/strict";
import { computeTrendScore } from "@/services/analytics/trendAggregationService";

test("computeTrendScore stays within 0..100 bounds", () => {
  const score = computeTrendScore({
    counts: {
      issueId: "x",
      impressions: 10,
      opens: 1000,
      shares: 500,
      votes: 800,
      exports: 400
    },
    hoursSincePublished: 1
  });

  assert.ok(score >= 0 && score <= 100);
});

test("computeTrendScore rewards recency with equal engagement", () => {
  const counts = {
    issueId: "x",
    impressions: 100,
    opens: 40,
    shares: 10,
    votes: 12,
    exports: 6
  };

  const fresh = computeTrendScore({ counts, hoursSincePublished: 4 });
  const stale = computeTrendScore({ counts, hoursSincePublished: 200 });

  assert.ok(fresh > stale);
});

import test from "node:test";
import assert from "node:assert/strict";
import { SearchService } from "@/services/search/searchService";

test("sanitizeQuery strips noisy operator-like characters", () => {
  const sanitized = SearchService.sanitizeQuery("  \"ai\" <script> {trend}  ");
  assert.equal(sanitized.includes("\""), false);
  assert.equal(sanitized.includes("<"), false);
  assert.equal(sanitized.includes("{"), false);
});

test("sanitizeQuery clamps overly long inputs", () => {
  const long = "a".repeat(400);
  const sanitized = SearchService.sanitizeQuery(long);
  assert.ok(sanitized.length <= 80);
});

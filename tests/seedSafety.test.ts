import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeSeedText } from "@/lib/safety/seedSafety";

test("sanitizeSeedText strips URLs", () => {
  const result = sanitizeSeedText("Look at this https://example.com right now");
  assert.equal(result.removedUrls, true);
  assert.ok(!result.sanitizedText.includes("http"));
});

test("sanitizeSeedText rejects obvious PII", () => {
  const result = sanitizeSeedText("Call me at 555-123-4567 about the issue");
  assert.equal(result.containsPII, true);
  assert.equal(result.isSafe, false);
});

test("sanitizeSeedText flags full names", () => {
  const result = sanitizeSeedText("John Smith did something online");
  assert.equal(result.containsSuspiciousName, true);
  assert.equal(result.isSafe, false);
});

test("sanitizeSeedText clamps length", () => {
  const long = "a".repeat(500);
  const result = sanitizeSeedText(long);
  assert.ok(result.sanitizedText.length <= 240);
});

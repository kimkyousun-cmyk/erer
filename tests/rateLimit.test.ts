import test from "node:test";
import assert from "node:assert/strict";
import { tokenBucket } from "@/lib/rateLimit";

test("tokenBucket enforces capacity and refills over time", () => {
  const originalNow = Date.now;
  let now = 0;
  Date.now = () => now;

  const config = { capacity: 2, refillRatePerSec: 1 };
  const key = "test-bucket";

  const a = tokenBucket(key, config);
  const b = tokenBucket(key, config);
  const c = tokenBucket(key, config);

  assert.equal(a.allowed, true);
  assert.equal(b.allowed, true);
  assert.equal(c.allowed, false);

  now += 1000;
  const d = tokenBucket(key, config);
  assert.equal(d.allowed, true);

  Date.now = originalNow;
});

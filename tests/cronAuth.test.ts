import test from "node:test";
import assert from "node:assert/strict";
import { cronSecretConfigured, verifyCronSecret } from "@/lib/security/cronAuth";

test("verifyCronSecret fails when secret missing", () => {
  const original = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;

  assert.equal(cronSecretConfigured(), false);
  const result = verifyCronSecret(new Headers());
  assert.equal(result.ok, false);

  process.env.CRON_SECRET = original;
});

test("verifyCronSecret succeeds with matching header", () => {
  const original = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";

  const headers = new Headers({ "x-cron-secret": "test-secret" });
  const result = verifyCronSecret(headers);
  assert.equal(result.ok, true);

  process.env.CRON_SECRET = original;
});

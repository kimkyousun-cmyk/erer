import test from "node:test";
import assert from "node:assert/strict";
import { voteUpsertKey } from "@/repositories/voteRepo";

test("voteUpsertKey is stable for same inputs", () => {
  const key1 = voteUpsertKey("issue1", "sessionA");
  const key2 = voteUpsertKey("issue1", "sessionA");
  assert.equal(key1, key2);
});

test("voteUpsertKey differentiates sessions", () => {
  const key1 = voteUpsertKey("issue1", "sessionA");
  const key2 = voteUpsertKey("issue1", "sessionB");
  assert.notEqual(key1, key2);
});

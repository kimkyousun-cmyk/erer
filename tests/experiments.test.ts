import test from "node:test";
import assert from "node:assert/strict";
import { chooseVariant, ensureControlVariant } from "@/services/experiments/experimentService";

test("chooseVariant is deterministic for a given seed", () => {
  const variants = ensureControlVariant([
    { name: "control", weight: 50 },
    { name: "variantA", weight: 50 }
  ]);

  const seed = "HOME_LAYOUT_DENSITY:session-123";
  const first = chooseVariant(variants, seed);
  const second = chooseVariant(variants, seed);

  assert.equal(first, second);
});

test("chooseVariant respects weight bias across many seeds", () => {
  const variants = ensureControlVariant([
    { name: "control", weight: 90 },
    { name: "variantB", weight: 10 }
  ]);

  let variantBCount = 0;
  for (let i = 0; i < 200; i += 1) {
    const picked = chooseVariant(variants, `seed-${i}`);
    if (picked === "variantB") variantBCount += 1;
  }

  assert.ok(variantBCount > 0);
  assert.ok(variantBCount < 80);
});

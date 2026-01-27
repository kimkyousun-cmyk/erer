import test from "node:test";
import assert from "node:assert/strict";
import { shortsPackageSchema } from "@/lib/validation/shorts";
import { generateShortsPackageFromSeed } from "@/services/shorts/shortsPackageService";

test("generateShortsPackageFromSeed returns a valid package", async () => {
  const pkg = await generateShortsPackageFromSeed(
    "A workplace adds focus alarms that ping your team when you break concentration."
  );

  const parsed = shortsPackageSchema.safeParse(pkg);
  assert.equal(parsed.success, true);
  assert.equal(pkg.image_prompts.length, 8);
});

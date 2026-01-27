import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "@/lib/slug";

test("slugify removes special characters and normalizes spacing", () => {
  const slug = slugify("Hello, World!  AI & Culture");
  assert.equal(slug, "hello-world-ai-culture");
});

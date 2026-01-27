import test from "node:test";
import assert from "node:assert/strict";
import { issueOutputSchema } from "@/lib/validation/generator";
import { MockGenerator } from "@/services/generator/mockGenerator";

test("MockGenerator produces valid IssueOutput", async () => {
  const generator = new MockGenerator();
  const result = await generator.generateIssue({
    seedText: "A campus adds AI noise monitors and students debate if it helps or harms trust.",
    tags: ["ai", "education"],
    sensitivity: "SAFE"
  });

  const parsed = issueOutputSchema.safeParse(result.output);
  assert.equal(parsed.success, true);
  assert.ok(result.modelName.includes("mock"));
});

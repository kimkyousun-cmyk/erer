import test from "node:test";
import assert from "node:assert/strict";
import { evaluateOutputSafety } from "@/lib/safety/outputSafety";
import { issueOutputSchema } from "@/lib/validation/generator";

const safeOutput = issueOutputSchema.parse({
  title: "A Platform Adds Mood Scores to Profiles",
  contextSummary:
    "A product update started labeling accounts by mood. People feel it turns emotion into a public score rather than a private experience.",
  verdictLine: "Emotion becomes a ranking",
  dominantEmotion: "DIVISION",
  angerScore: 70,
  humorScore: 44,
  divisionScore: 82,
  tags: ["product", "culture"],
  timelineEvents: [
    { phase: "TRIGGER", label: "Trigger", detail: "A screenshot spread fast and framed it as emotional scoring.", order: 0 },
    { phase: "ESCALATION", label: "Escalation", detail: "People split between usefulness and dignity concerns.", order: 1 },
    { phase: "PEAK", label: "Peak", detail: "The update became a symbol for performance culture.", order: 2 },
    { phase: "COOLING", label: "Cooling", detail: "Attention cools but returns with each new screenshot.", order: 3 }
  ],
  reactions: [
    { emotionType: "ANGER", intensity: 4, text: "This feels like scoring people, not helping them." },
    { emotionType: "DIVISION", intensity: 4, text: "Some will love it. Others will feel labeled." },
    { emotionType: "HUMOR", intensity: 2, text: "Can't wait to optimize my mood leaderboard." },
    { emotionType: "SUPPORT", intensity: 2, text: "At least it makes the vibe visible." },
    { emotionType: "NEUTRAL", intensity: 2, text: "The feature is simple; the meaning is not." },
    { emotionType: "ANGER", intensity: 4, text: "We keep turning people into dashboards." },
    { emotionType: "DIVISION", intensity: 3, text: "This depends on how you think identity works online." },
    { emotionType: "HUMOR", intensity: 2, text: "Mood as a service was inevitable." }
  ],
  safety: {
    containsSensitiveName: false,
    containsPII: false,
    riskLevel: "LOW",
    notes: "safe"
  }
});

test("evaluateOutputSafety stays low for safe output", () => {
  const result = evaluateOutputSafety(safeOutput);
  assert.equal(result.riskLevel, "LOW");
});

test("evaluateOutputSafety detects PII patterns", () => {
  const withEmail = {
    ...safeOutput,
    reactions: [...safeOutput.reactions, { emotionType: "NEUTRAL", intensity: 1, text: "email me at test@example.com" }]
  };

  const result = evaluateOutputSafety(withEmail);
  assert.equal(result.containsPII, true);
  assert.equal(result.riskLevel, "HIGH");
});

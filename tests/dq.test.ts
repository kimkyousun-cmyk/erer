import test from "node:test";
import assert from "node:assert/strict";
import type { Issue, IssueTimelineEvent, ReactionSample } from "@prisma/client";
import { QualityService } from "@/services/dq/qualityService";

function baseIssue(overrides: Partial<Issue> = {}): Issue {
  const now = new Date("2026-01-20T00:00:00Z");
  return {
    id: "issue_test_1",
    slug: "emotion-radar-duplicate-check",
    title: "Emotion Radar ranking shift",
    contextSummary:
      "A platform update changes how mood scores are ranked in public dashboards. Some people feel it clarifies the vibe, while others think it hides meaningful nuance.",
    verdictLine: "People are split on whether this improves clarity or erases nuance",
    dominantEmotion: "DIVISION",
    angerScore: 61,
    humorScore: 44,
    divisionScore: 78,
    tags: "product,ranking,ai",
    status: "DRAFT",
    requiresEdit: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    ...overrides
  } as Issue;
}

const timeline: IssueTimelineEvent[] = [
  { id: "t1", issueId: "issue_test_1", phase: "TRIGGER", label: "Trigger", detail: "A ranking tweak rolls out.", order: 0 },
  { id: "t2", issueId: "issue_test_1", phase: "ESCALATION", label: "Escalation", detail: "Creators notice mismatches.", order: 1 },
  { id: "t3", issueId: "issue_test_1", phase: "PEAK", label: "Peak", detail: "Debate spills into comment threads.", order: 2 },
  { id: "t4", issueId: "issue_test_1", phase: "COOLING", label: "Cooling", detail: "People settle into camps.", order: 3 }
] as IssueTimelineEvent[];

const reactions: ReactionSample[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `r${i}`,
  issueId: "issue_test_1",
  emotionType: i % 2 === 0 ? "DIVISION" : "ANGER",
  text: `Synthetic reaction ${i}`,
  intensity: 3
})) as ReactionSample[];

test("QualityService passes a well-shaped, low-risk issue", async () => {
  const issue = baseIssue();
  const result = await QualityService.evaluateIssue(
    {
      issue,
      timelineEvents: timeline,
      reactions,
      runType: "ON_CREATE"
    },
    {
      recentIssues: [],
      recentSeeds: [],
      issuesToday: []
    }
  );

  assert.equal(result.action, "PASS");
  assert.ok(result.qualityScore >= 70);
});

test("QualityService flags severe duplication risk", async () => {
  const issue = baseIssue();
  const duplicate = baseIssue({ id: "other", title: issue.title, contextSummary: issue.contextSummary });

  const result = await QualityService.evaluateIssue(
    {
      issue,
      timelineEvents: timeline,
      reactions,
      runType: "ON_CREATE"
    },
    {
      recentIssues: [duplicate],
      recentSeeds: [{ inputText: `${issue.title}. ${issue.contextSummary}` }],
      issuesToday: []
    }
  );

  assert.ok(result.flags.some((f) => f.startsWith("DUPLICATE")));
  assert.notEqual(result.action, "PASS");
});

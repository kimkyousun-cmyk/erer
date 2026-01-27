import type { Issue, IssueTimelineEvent, ReactionSample } from "@prisma/client";
import { logger } from "@/lib/log";
import { evaluateOutputSafety } from "@/lib/safety/outputSafety";
import { issueOutputSchema, type IssueOutput } from "@/lib/validation/generator";
import { QualityRepo } from "@/repositories/qualityRepo";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string) {
  return normalizeText(text)
    .split(" ")
    .filter((t) => t.length >= 3)
    .slice(0, 120);
}

function trigramSet(text: string) {
  const base = `  ${normalizeText(text)}  `;
  const set = new Set<string>();
  for (let i = 0; i < base.length - 2; i += 1) {
    set.add(base.slice(i, i + 3));
  }
  return set;
}

function trigramSimilarity(a: string, b: string) {
  const setA = trigramSet(a);
  const setB = trigramSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const tri of setA) {
    if (setB.has(tri)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function repetitionRatio(text: string) {
  const words = tokens(text);
  if (words.length < 8) return 0;
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const maxCount = Math.max(...counts.values());
  return maxCount / words.length;
}

function toOutputShape(input: {
  issue: Issue;
  timelineEvents: IssueTimelineEvent[];
  reactions: ReactionSample[];
}): IssueOutput {
  return issueOutputSchema.parse({
    title: input.issue.title,
    contextSummary: input.issue.contextSummary,
    verdictLine: input.issue.verdictLine,
    dominantEmotion: input.issue.dominantEmotion as IssueOutput["dominantEmotion"],
    angerScore: input.issue.angerScore,
    humorScore: input.issue.humorScore,
    divisionScore: input.issue.divisionScore,
    tags: parseTags(input.issue.tags),
    timelineEvents: input.timelineEvents.map((e) => ({
      phase: e.phase as IssueOutput["timelineEvents"][number]["phase"],
      label: e.label,
      detail: e.detail,
      order: e.order
    })),
    reactions: input.reactions.map((r) => ({
      emotionType: r.emotionType as IssueOutput["reactions"][number]["emotionType"],
      text: r.text,
      intensity: r.intensity
    })),
    safety: {
      containsSensitiveName: false,
      containsPII: false,
      riskLevel: "LOW",
      notes: "DQ evaluation"
    }
  });
}

function verdictMismatchFlag(issue: Issue) {
  const verdict = issue.verdictLine.toLowerCase();
  if (verdict.includes("split") && issue.divisionScore < 55) return "VERDICT_SCORE_MISMATCH";
  if ((verdict.includes("mock") || verdict.includes("laug")) && issue.humorScore < 50)
    return "VERDICT_SCORE_MISMATCH";
  if ((verdict.includes("backlash") || verdict.includes("line")) && issue.angerScore < 55)
    return "VERDICT_SCORE_MISMATCH";
  return null;
}

function extremeScoreFlag(issue: Issue) {
  const scores = [issue.angerScore, issue.humorScore, issue.divisionScore];
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  if (max >= 97 && min >= 70) return "EXTREME_SCORE_PROFILE";
  return null;
}

function lengthFlags(issue: Issue, timelineEvents: IssueTimelineEvent[], reactions: ReactionSample[]) {
  const flags: string[] = [];
  if (issue.title.length < 12 || issue.title.length > 72) flags.push("TITLE_LENGTH_OUT_OF_RANGE");
  if (issue.contextSummary.length < 80 || issue.contextSummary.length > 280)
    flags.push("CONTEXT_LENGTH_OUT_OF_RANGE");
  if (issue.verdictLine.length < 12 || issue.verdictLine.length > 90)
    flags.push("VERDICT_LENGTH_OUT_OF_RANGE");
  if (timelineEvents.length < 4) flags.push("TIMELINE_INCOMPLETE");
  if (reactions.length < 6) flags.push("REACTIONS_TOO_FEW");
  return flags;
}

function duplicationFlags(issue: Issue, recent: Array<{ id: string; title: string; contextSummary: string }>, recentSeeds: string[]) {
  let maxTitleSim = 0;
  let maxContextSim = 0;

  for (const other of recent) {
    if (other.id === issue.id) continue;
    maxTitleSim = Math.max(maxTitleSim, trigramSimilarity(issue.title, other.title));
    maxContextSim = Math.max(maxContextSim, trigramSimilarity(issue.contextSummary, other.contextSummary));
  }

  const seedText = `${issue.title}. ${issue.contextSummary}`;
  let maxSeedSim = 0;
  for (const seed of recentSeeds) {
    maxSeedSim = Math.max(maxSeedSim, trigramSimilarity(seedText, seed));
  }

  const flags: string[] = [];
  if (maxTitleSim > 0.82) flags.push("DUPLICATE_TITLE_SIMILARITY");
  if (maxContextSim > 0.84) flags.push("DUPLICATE_CONTEXT_SIMILARITY");
  if (maxSeedSim > 0.88) flags.push("DUPLICATE_SEED_PATTERN");

  return {
    flags,
    maxTitleSim,
    maxContextSim,
    maxSeedSim
  };
}

function diversityFlags(issue: Issue, issuesToday: Array<{ tags: string }>) {
  const todayTags = issuesToday.flatMap((i) => parseTags(i.tags));
  const counts = new Map<string, number>();
  for (const tag of todayTags) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  const issueTags = parseTags(issue.tags);
  const saturated = issueTags.filter((tag) => (counts.get(tag) ?? 0) >= 4);
  if (saturated.length === 0) return [] as string[];
  return ["TAG_SATURATION"]; // keep flags compact; details can be derived later
}

function seoFlags(issue: Issue, recent: Array<{ id: string; contextSummary: string }>) {
  const flags: string[] = [];
  let maxContextSim = 0;
  for (const other of recent) {
    if (other.id === issue.id) continue;
    maxContextSim = Math.max(maxContextSim, trigramSimilarity(issue.contextSummary, other.contextSummary));
  }
  if (maxContextSim > 0.9) flags.push("SEO_DESCRIPTION_DUPLICATE");
  return { flags, maxContextSim };
}

function qualityAction(input: {
  score: number;
  safetyRisk: "LOW" | "MEDIUM" | "HIGH";
  containsPII: boolean;
  duplicationSevere: boolean;
}) {
  if (input.containsPII || input.safetyRisk === "HIGH") return "BLOCK_PUBLISH" as const;
  if (input.score < 55) return "BLOCK_PUBLISH" as const;
  if (input.duplicationSevere || input.safetyRisk === "MEDIUM" || input.score < 72)
    return "NEEDS_EDIT" as const;
  return "PASS" as const;
}

export interface QualityEvaluation {
  qualityScore: number;
  action: "PASS" | "NEEDS_EDIT" | "BLOCK_PUBLISH";
  flags: string[];
  explanation: string;
  diagnostics: {
    maxTitleSim: number;
    maxContextSim: number;
    maxSeedSim: number;
    repetition: number;
    seoContextSim: number;
  };
}

export const QualityService = {
  async evaluateIssue(input: {
    issue: Issue;
    timelineEvents: IssueTimelineEvent[];
    reactions: ReactionSample[];
    runType: "ON_CREATE" | "ON_PUBLISH" | "NIGHTLY";
  }, overrides?: {
    recentIssues?: Array<{ id: string; title: string; contextSummary: string; tags: string; status: string; createdAt: Date; publishedAt: Date | null }>;
    recentSeeds?: Array<{ inputText: string }>;
    issuesToday?: Array<{ id: string; tags: string; createdAt: Date }>;
  }): Promise<QualityEvaluation> {
    const [recentIssues, recentSeeds, issuesToday] = overrides
      ? [
          overrides.recentIssues ?? [],
          overrides.recentSeeds ?? [],
          overrides.issuesToday ?? []
        ]
      : await Promise.all([
          QualityRepo.listRecentIssues(160),
          QualityRepo.listRecentGenerationSeeds(120),
          QualityRepo.listIssuesCreatedOnUtcDay(new Date())
        ]);

    const recentSeedsText = recentSeeds.map((s) => s.inputText);

    const outputShape = toOutputShape(input);
    const safety = evaluateOutputSafety(outputShape);

    const flags: string[] = [];

    flags.push(...lengthFlags(input.issue, input.timelineEvents, input.reactions));

    const duplication = duplicationFlags(input.issue, recentIssues, recentSeedsText);
    flags.push(...duplication.flags);

    const repetition = repetitionRatio(`${input.issue.contextSummary} ${input.issue.verdictLine}`);
    if (repetition > 0.18) flags.push("REPETITIVE_LANGUAGE");

    const mismatch = verdictMismatchFlag(input.issue);
    if (mismatch) flags.push(mismatch);

    const extreme = extremeScoreFlag(input.issue);
    if (extreme) flags.push(extreme);

    flags.push(...diversityFlags(input.issue, issuesToday));

    const seo = seoFlags(input.issue, recentIssues);
    flags.push(...seo.flags);

    if (safety.containsSensitiveName) flags.push("SENSITIVE_NAME_PATTERN");
    if (safety.containsPII) flags.push("PII_PATTERN_DETECTED");
    if (safety.riskLevel !== "LOW") flags.push(`SAFETY_RISK_${safety.riskLevel}`);

    let score = 88;
    score -= lengthFlags(input.issue, input.timelineEvents, input.reactions).length * 6;
    score -= duplication.flags.length * 12;
    score -= flags.includes("REPETITIVE_LANGUAGE") ? 8 : 0;
    score -= flags.includes("VERDICT_SCORE_MISMATCH") ? 7 : 0;
    score -= flags.includes("EXTREME_SCORE_PROFILE") ? 6 : 0;
    score -= flags.includes("TAG_SATURATION") ? 6 : 0;
    score -= flags.includes("SEO_DESCRIPTION_DUPLICATE") ? 8 : 0;
    score -= safety.riskLevel === "MEDIUM" ? 12 : safety.riskLevel === "HIGH" ? 25 : 0;
    score -= safety.containsSensitiveName ? 10 : 0;
    score -= safety.containsPII ? 40 : 0;

    const qualityScore = clamp(Math.round(score), 0, 100);

    const action = qualityAction({
      score: qualityScore,
      safetyRisk: safety.riskLevel,
      containsPII: safety.containsPII,
      duplicationSevere: duplication.maxTitleSim > 0.9 || duplication.maxContextSim > 0.92
    });

    const explanation =
      action === "PASS"
        ? "Looks publishable: structure is intact and risk signals are low."
        : action === "NEEDS_EDIT"
          ? "Needs editorial cleanup: reduce duplication risk, tighten shape, or resolve safety flags."
          : "Blocked for now: safety or quality risk is too high to publish without intervention.";

    logger.info("quality.evaluated", {
      issueId: input.issue.id,
      runType: input.runType,
      action,
      qualityScore,
      flagCount: flags.length
    });

    return {
      qualityScore,
      action,
      flags: Array.from(new Set(flags)),
      explanation,
      diagnostics: {
        maxTitleSim: duplication.maxTitleSim,
        maxContextSim: duplication.maxContextSim,
        maxSeedSim: duplication.maxSeedSim,
        repetition,
        seoContextSim: seo.maxContextSim
      }
    };
  },

  async runAndStore(issueId: string, runType: "ON_CREATE" | "ON_PUBLISH" | "NIGHTLY") {
    const { prisma } = await import("@/lib/db/prisma");
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        timelineEvents: { orderBy: { order: "asc" } },
        reactions: true
      }
    });

    if (!issue) {
      throw new Error("Issue not found for quality evaluation");
    }

    const evaluation = await QualityService.evaluateIssue({
      issue,
      timelineEvents: issue.timelineEvents,
      reactions: issue.reactions,
      runType
    });

    const report = await QualityRepo.createReport({
      issueId: issue.id,
      qualityScore: evaluation.qualityScore,
      action: evaluation.action,
      flags: evaluation.flags,
      explanation: evaluation.explanation,
      runType
    });

    return { evaluation, report };
  }
};

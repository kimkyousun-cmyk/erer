import type { Issue, IssueTimelineEvent, ReactionSample, ShortsJob } from "@prisma/client";
import type { DominantEmotion, IssueDetail, IssueSummary } from "@/lib/types";
import { computeIssueScores } from "@/services/aggregation/issueAggregation";

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 6);
}

function toneFromDominant(dominant: string): DominantEmotion {
  if (dominant === "ANGER" || dominant === "HUMOR" || dominant === "DIVISION") {
    return dominant.toLowerCase() as DominantEmotion;
  }
  return "calm";
}

function trendFromDates(issue: Issue) {
  const published = issue.publishedAt?.getTime() ?? issue.createdAt.getTime();
  const hoursAgo = (Date.now() - published) / 1000 / 3600;
  if (hoursAgo < 18) return "heating" as const;
  if (hoursAgo > 168) return "cooling" as const;
  return "stable" as const;
}

function trendFromTrendScore(trendScore: number | null | undefined) {
  if (trendScore == null) return null;
  if (trendScore >= 68) return "heating" as const;
  if (trendScore <= 28) return "cooling" as const;
  return "stable" as const;
}

function trendDeltaFromScore(delta?: number | null) {
  if (delta == null || !Number.isFinite(delta)) return null;
  const rounded = Math.round(delta);
  if (rounded === 0) {
    return { value: 0, direction: "flat" as const, label: "0" };
  }
  const direction = rounded > 0 ? "up" : "down";
  const label = `${rounded > 0 ? "+" : ""}${rounded}`;
  return { value: rounded, direction, label };
}

function extractTrigger(timeline: IssueTimelineEvent[]) {
  const trigger = timeline.find((t) => t.phase === "TRIGGER");
  return trigger?.detail ?? timeline[0]?.detail ?? "A triggering moment reframed the topic emotionally.";
}

function formatKeyTrigger(label: string, detail: string) {
  const text = `${label}: ${detail}`;
  if (text.length <= 140) return text;
  return `${text.slice(0, 137).trimEnd()}...`;
}

function keyTriggersFromTimeline(timeline: IssueTimelineEvent[]) {
  const prioritized = ["TRIGGER", "ESCALATION", "PEAK"];
  const triggers: IssueTimelineEvent[] = [];

  for (const phase of prioritized) {
    const match = timeline.find((event) => event.phase === phase);
    if (match) triggers.push(match);
  }

  if (triggers.length < 3) {
    const extras = timeline.filter((event) => !triggers.includes(event));
    triggers.push(...extras);
  }

  return triggers.slice(0, 3).map((event) => formatKeyTrigger(event.label, event.detail));
}

function whyItBlewUp(scores: { anger: number; humor: number; division: number }) {
  const lines: string[] = [];
  if (scores.anger > 70) lines.push("It reads as a boundary issue, not a neutral update.");
  if (scores.division > 75) lines.push("Identity and values are driving the debate more than details.");
  if (scores.humor > 65) lines.push("Meme energy keeps the topic circulating long after the first take.");
  lines.push("The topic compresses a larger cultural anxiety into one shareable moment.");
  return lines.slice(0, 4);
}

function whyPeopleDisagree() {
  return {
    sideA:
      "Some people feel the emotional cost lands on ordinary users first, so restraint feels like basic respect.",
    sideB:
      "Others feel progress always looks uncomfortable early, so backlash feels like fear wearing moral language."
  };
}

function quickSummaryLines(input: {
  title: string;
  context: string;
  verdict: string;
  scores: { anger: number; humor: number; division: number };
}) {
  const topMood =
    input.scores.anger >= input.scores.humor && input.scores.anger >= input.scores.division
      ? "Anger"
      : input.scores.humor >= input.scores.division
        ? "Humor"
        : "Division";

  return [
    `Trigger: ${input.context}`,
    `Verdict: ${input.verdict}`,
    `Mood snapshot: ${topMood} leads (A${input.scores.anger} · H${input.scores.humor} · D${input.scores.division}).`
  ];
}

function faqForIssue(input: {
  title: string;
  verdict: string;
  scores: { anger: number; humor: number; division: number };
}) {
  const dominant =
    input.scores.anger >= input.scores.humor && input.scores.anger >= input.scores.division
      ? "anger"
      : input.scores.humor >= input.scores.division
        ? "humor"
        : "division";

  return [
    {
      question: `What is the core issue in “${input.title}”?`,
      answer: input.verdict
    },
    {
      question: "Why are people reacting this way?",
      answer:
        dominant === "anger"
          ? "The reaction reads as a boundary being crossed, so the tone is protective and sharp."
          : dominant === "humor"
            ? "The topic is being processed through jokes first, which keeps it circulating."
            : "The topic splits identity groups, so reactions are polarized and persistent."
    },
    {
      question: "Is this a stable trend or a spike?",
      answer:
        input.scores.division > 70
          ? "It is likely to stay divisive because people feel personally invested."
          : "Momentum depends on whether a new trigger appears."
    }
  ];
}

export async function toIssueSummary(
  issue: Issue,
  options?: { trendScore?: number | null; trendDelta?: number | null }
): Promise<IssueSummary> {
  const agg = await computeIssueScores(issue);
  const trendFromScore = trendFromTrendScore(options?.trendScore);
  const trendDelta = trendDeltaFromScore(options?.trendDelta);
  const publishedAt = issue.publishedAt ?? issue.createdAt;

  return {
    id: issue.id,
    slug: issue.slug,
    title: issue.title,
    context: issue.contextSummary,
    scores: {
      anger: agg.anger,
      humor: agg.humor,
      division: agg.division
    },
    dominantEmotion: toneFromDominant(issue.dominantEmotion),
    verdict: {
      label: issue.verdictLine,
      tone: toneFromDominant(issue.dominantEmotion)
    },
    trend: trendFromScore ?? trendFromDates(issue),
    trendDelta,
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    updatedAt: issue.updatedAt.toISOString().slice(0, 10),
    tags: parseTags(issue.tags)
  };
}

export async function toIssueDetail(input: {
  issue: Issue;
  timelineEvents: IssueTimelineEvent[];
  reactions: ReactionSample[];
  shortsJobs?: ShortsJob[];
}): Promise<IssueDetail> {
  const agg = await computeIssueScores(input.issue);
  const latestShorts = input.shortsJobs?.[0];
  const publishedAt = input.issue.publishedAt ?? input.issue.createdAt;

  return {
    id: input.issue.id,
    slug: input.issue.slug,
    title: input.issue.title,
    context: input.issue.contextSummary,
    scores: {
      anger: agg.anger,
      humor: agg.humor,
      division: agg.division
    },
    dominantEmotion: toneFromDominant(input.issue.dominantEmotion),
    verdict: {
      label: input.issue.verdictLine,
      tone: toneFromDominant(input.issue.dominantEmotion)
    },
    trend: trendFromDates(input.issue),
    updatedAt: input.issue.updatedAt.toISOString().slice(0, 10),
    publishedAt: publishedAt ? publishedAt.toISOString() : null,
    tags: parseTags(input.issue.tags),
    trigger: extractTrigger(input.timelineEvents),
    keyTriggers: keyTriggersFromTimeline(input.timelineEvents),
    timeline: input.timelineEvents.map((event) => ({
      key: event.phase.toLowerCase() as "trigger" | "escalation" | "peak" | "cooling",
      label: event.label,
      summary: event.detail,
      intensity:
        event.phase === "PEAK"
          ? Math.max(78, agg.anger, agg.division)
          : event.phase === "ESCALATION"
            ? Math.max(65, agg.division)
            : event.phase === "TRIGGER"
              ? Math.max(58, agg.humor, agg.anger)
              : Math.min(60, Math.round((agg.anger + agg.division) / 2))
    })),
    reactions: input.reactions.map((reaction) => ({
      id: reaction.id,
      emotion: (reaction.emotionType === "SUPPORT" ? "division" : reaction.emotionType.toLowerCase()) as
        | "anger"
        | "humor"
        | "division",
      text: reaction.text
    })),
    quickSummary: quickSummaryLines({
      title: input.issue.title,
      context: input.issue.contextSummary,
      verdict: input.issue.verdictLine,
      scores: { anger: agg.anger, humor: agg.humor, division: agg.division }
    }),
    faq: faqForIssue({
      title: input.issue.title,
      verdict: input.issue.verdictLine,
      scores: { anger: agg.anger, humor: agg.humor, division: agg.division }
    }),
    whyItBlewUp: whyItBlewUp({ anger: agg.anger, humor: agg.humor, division: agg.division }),
    whyPeopleDisagree: whyPeopleDisagree(),
    communityPulse: {
      agree: agg.votePulse.agree,
      disagree: agg.votePulse.disagree,
      overreaction: agg.votePulse.overreaction,
      justified: agg.votePulse.justified,
      matrix: agg.votePulse.matrix
    },
    shorts: latestShorts
      ? {
          status: latestShorts.status as "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED",
          resultVideoUrl: latestShorts.resultVideoUrl ?? null,
          updatedAt: latestShorts.updatedAt.toISOString(),
          externalRunId: latestShorts.externalRunId ?? null
        }
      : null
  };
}

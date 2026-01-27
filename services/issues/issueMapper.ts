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

function extractTrigger(timeline: IssueTimelineEvent[]) {
  const trigger = timeline.find((t) => t.phase === "TRIGGER");
  return trigger?.detail ?? timeline[0]?.detail ?? "A triggering moment reframed the topic emotionally.";
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

export async function toIssueSummary(
  issue: Issue,
  options?: { trendScore?: number | null }
): Promise<IssueSummary> {
  const agg = await computeIssueScores(issue);
  const trendFromScore = trendFromTrendScore(options?.trendScore);

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
    tags: parseTags(input.issue.tags),
    trigger: extractTrigger(input.timelineEvents),
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
    whyItBlewUp: whyItBlewUp({ anger: agg.anger, humor: agg.humor, division: agg.division }),
    whyPeopleDisagree: whyPeopleDisagree(),
    communityPulse: {
      agree: agg.votePulse.agree,
      disagree: agg.votePulse.disagree,
      overreaction: agg.votePulse.overreaction,
      justified: agg.votePulse.justified
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

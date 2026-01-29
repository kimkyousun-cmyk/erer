import { seedIssues } from "@/data/seedIssues";
import type { IssueDetail, IssueSeed, IssueSummary } from "@/lib/types";
import { clamp, formatDate, seededRandom, slugToSeed } from "@/lib/utils";
import { analyzeEmotions } from "@/services/emotionAnalyzer";
import { getVoteState, toCommunityPulse, voteTilt } from "@/lib/voteStore";
import { simulateReactions } from "@/services/reactionSimulator";

function jitterVelocity(seed: IssueSeed): number {
  const rand = seededRandom(slugToSeed(seed.slug));
  const jitter = (rand() - 0.5) * 0.08;
  return clamp(seed.baselineVelocity + jitter, 0, 1);
}

function whyItBlewUp(seed: IssueSeed): string[] {
  const drivers = seed.drivers;
  const bullets: string[] = [];

  if (drivers.moralViolation > 0.55) {
    bullets.push("It reads as a moral line-crossing, not just a product choice.");
  }
  if (drivers.identityConflict > 0.6) {
    bullets.push("People see their identity group in the story, so reactions escalate fast.");
  }
  if (drivers.novelty > 0.65) {
    bullets.push("Novelty fuels hot takes because no shared script exists yet.");
  }
  if (drivers.humorPotential > 0.7) {
    bullets.push("High meme-ability keeps the issue circulating even when facts stall.");
  }

  bullets.push(...seed.baggage);
  bullets.push(...seed.culturalContext);
  return bullets.slice(0, 6);
}

function whyPeopleDisagree(seed: IssueSeed) {
  return {
    sideA:
      "One side feels the emotional cost lands on ordinary people first, so restraint feels justified.",
    sideB:
      "The other side feels progress always looks messy at first, so backlash feels like fear dressed as principle."
  };
}

function quickSummaryLines(seed: IssueSeed, verdict: string, scores: { anger: number; humor: number; division: number }) {
  const topMood =
    scores.anger >= scores.humor && scores.anger >= scores.division
      ? "Anger"
      : scores.humor >= scores.division
        ? "Humor"
        : "Division";

  return [
    `Trigger: ${seed.trigger}`,
    `Verdict: ${verdict}`,
    `Mood snapshot: ${topMood} leads (A${scores.anger} · H${scores.humor} · D${scores.division}).`
  ];
}

function faqForSeed(seed: IssueSeed, verdict: string, scores: { anger: number; humor: number; division: number }) {
  const dominant =
    scores.anger >= scores.humor && scores.anger >= scores.division
      ? "anger"
      : scores.humor >= scores.division
        ? "humor"
        : "division";

  return [
    {
      question: `What is the core issue in “${seed.title}”?`,
      answer: verdict
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
        scores.division > 70
          ? "It is likely to stay divisive because people feel personally invested."
          : "Momentum depends on whether a new trigger appears."
    }
  ];
}

function keyTriggersFromTimeline(timeline: IssueSeed["timeline"]) {
  const prioritized: IssueSeed["timeline"] = [];
  const priorityKeys: Array<IssueSeed["timeline"][number]["key"]> = [
    "trigger",
    "escalation",
    "peak"
  ];

  for (const key of priorityKeys) {
    const match = timeline.find((phase) => phase.key === key);
    if (match) prioritized.push(match);
  }

  if (prioritized.length < 3) {
    const extras = timeline.filter((phase) => !prioritized.includes(phase));
    prioritized.push(...extras);
  }

  return prioritized.slice(0, 3).map((phase) => {
    const text = `${phase.label}: ${phase.summary}`;
    if (text.length <= 140) return text;
    return `${text.slice(0, 137).trimEnd()}...`;
  });
}

function toSummary(seed: IssueSeed): IssueSummary {
  const velocity = jitterVelocity(seed);
  const state = getVoteState(seed.slug);
  const tilt = voteTilt(state);
  const analysis = analyzeEmotions(seed, { velocity, voteTilt: tilt });

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    context: seed.context,
    scores: analysis.scores,
    dominantEmotion: analysis.dominantEmotion,
    verdict: analysis.verdict,
    trend: analysis.trend,
    publishedAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
    tags: seed.tags
  };
}

export function listIssues(): IssueSummary[] {
  return seedIssues.map(toSummary).sort((a, b) => {
    const scoreA = a.scores.anger + a.scores.humor + a.scores.division;
    const scoreB = b.scores.anger + b.scores.humor + b.scores.division;
    return scoreB - scoreA;
  });
}

export function getIssueDetail(slug: string): IssueDetail | null {
  const seed = seedIssues.find((issue) => issue.slug === slug);
  if (!seed) return null;

  const velocity = jitterVelocity(seed);
  const state = getVoteState(seed.slug);
  const tilt = voteTilt(state);
  const analysis = analyzeEmotions(seed, { velocity, voteTilt: tilt });

  const reactionCount = seed.tags.includes("ai") ? 10 : 8;

  return {
    id: seed.slug,
    slug: seed.slug,
    title: seed.title,
    context: seed.context,
    scores: analysis.scores,
    dominantEmotion: analysis.dominantEmotion,
    verdict: analysis.verdict,
    trend: analysis.trend,
    publishedAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
    tags: seed.tags,
    trigger: seed.trigger,
    keyTriggers: keyTriggersFromTimeline(seed.timeline),
    timeline: seed.timeline,
    reactions: simulateReactions(seed, reactionCount),
    quickSummary: quickSummaryLines(seed, analysis.verdict.label, analysis.scores),
    faq: faqForSeed(seed, analysis.verdict.label, analysis.scores),
    whyItBlewUp: whyItBlewUp(seed),
    whyPeopleDisagree: whyPeopleDisagree(seed),
    communityPulse: toCommunityPulse(state),
    shorts: null
  };
}

export function getAllSlugs(): string[] {
  return seedIssues.map((issue) => issue.slug);
}

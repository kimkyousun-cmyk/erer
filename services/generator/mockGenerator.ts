import { issueOutputSchema, type IssueOutput } from "@/lib/validation/generator";
import { seededRandom } from "@/lib/utils";
import type { GeneratorInput, GeneratorResult, IGenerator } from "@/services/generator/generatorTypes";

function hashSeed(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const verdictTemplates = [
  "People feel the tone is the real issue",
  "It looks efficient, but feels like pressure",
  "The feature works, the vibe does not",
  "Convenience wins until dignity loses",
  "This reads as control disguised as care"
];

const tagFallbacks = ["culture", "product", "policy", "internet", "ethics"];

const reactionTemplates = {
  ANGER: [
    "This solves a problem by creating a worse feeling.",
    "We keep normalizing systems that make people feel small.",
    "The message is clear: comfort for the platform, not the person.",
    "This is why trust keeps getting spent like it's free."
  ],
  HUMOR: [
    "This is one update away from being a parody account.",
    "I can't defend it, but I can absolutely screenshot it.",
    "The internet will process this as a joke first and a problem second.",
    "It is giving \"beta test on the public\" energy."
  ],
  DIVISION: [
    "Half the replies are clapping, half are typing essays.",
    "This depends on what you think progress is supposed to feel like.",
    "People aren't arguing facts; they're arguing identity.",
    "The idea sounds fair until you imagine being on the wrong side of it."
  ],
  SUPPORT: [
    "There is a real problem here and at least someone is trying.",
    "Not perfect, but better than leaving the chaos untouched.",
    "This will help the people who were already losing under the old system."
  ],
  NEUTRAL: [
    "The feature is simple. The emotion it triggers is not.",
    "This is a design decision that becomes a cultural signal.",
    "The debate is less about mechanics and more about meaning."
  ]
} as const;

type EmotionKey = keyof typeof reactionTemplates;

function buildTimeline(seedText: string): IssueOutput["timelineEvents"] {
  const root = seedText.slice(0, 80);
  return [
    {
      phase: "TRIGGER",
      label: "Trigger",
      detail: `A short clip or screenshot reframed the topic as emotional, not technical: ${root}.`,
      order: 0
    },
    {
      phase: "ESCALATION",
      label: "Escalation",
      detail:
        "The internet split into two stories fast: one about usefulness and one about what it says about people.",
      order: 1
    },
    {
      phase: "PEAK",
      label: "Peak Reaction",
      detail:
        "At peak heat, the issue turned into a symbol. People projected their own fatigue, identity, and prior baggage onto it.",
      order: 2
    },
    {
      phase: "COOLING",
      label: "Cooling",
      detail:
        "Attention cools in waves, but each new example can instantly reactivate the same emotional framing.",
      order: 3
    }
  ];
}

function scoreFromSeed(seedText: string) {
  const rand = seededRandom(hashSeed(seedText));

  const anger = Math.round(52 + rand() * 38);
  const humor = Math.round(28 + rand() * 52);
  const division = Math.round(55 + rand() * 40);

  const dominant: IssueOutput["dominantEmotion"] =
    division > anger && division > humor
      ? "DIVISION"
      : anger > humor
        ? "ANGER"
        : humor > 70
          ? "HUMOR"
          : "MIXED";

  return { anger, humor, division, dominant };
}

function pick<T>(items: readonly T[], rand: () => number) {
  const idx = Math.floor(rand() * items.length);
  return items[idx];
}

function buildReactions(seedText: string): IssueOutput["reactions"] {
  const rand = seededRandom(hashSeed(seedText) + 7);
  const emotions: EmotionKey[] = [
    "ANGER",
    "DIVISION",
    "HUMOR",
    "DIVISION",
    "ANGER",
    "SUPPORT",
    "HUMOR",
    "NEUTRAL",
    "DIVISION",
    "ANGER"
  ];

  return emotions.slice(0, 10).map((emotion, i) => ({
    emotionType: emotion,
    intensity: Math.max(1, Math.min(5, Math.round(2 + rand() * 3))),
    text: pick(reactionTemplates[emotion], rand),
    // Preserve stable ordering.
    orderHint: i
  }))
  .map(({ orderHint: _orderHint, ...rest }) => rest);
}

function shortTitle(seedText: string) {
  const base = seedText.replace(/\.$/, "").slice(0, 58);
  return base.length < 18 ? `${base} Sparks a Mood Split` : base;
}

export class MockGenerator implements IGenerator {
  async generateIssue(input: GeneratorInput): Promise<GeneratorResult> {
    const rand = seededRandom(hashSeed(input.seedText) + input.tags.join(",").length);
    const scores = scoreFromSeed(input.seedText);

    const tags = input.tags.length > 0 ? input.tags.slice(0, 5) : [pick(tagFallbacks, rand)];

    const output: IssueOutput = {
      title: shortTitle(input.seedText),
      contextSummary:
        "This topic is spreading because it compresses a bigger anxiety into one visible moment. People are reacting to what it symbolizes, not just what happened.",
      verdictLine: pick(verdictTemplates, rand),
      dominantEmotion: scores.dominant,
      angerScore: scores.anger,
      humorScore: scores.humor,
      divisionScore: scores.division,
      tags,
      timelineEvents: buildTimeline(input.seedText),
      reactions: buildReactions(input.seedText),
      safety: {
        containsSensitiveName: false,
        containsPII: false,
        riskLevel: input.sensitivity === "CAUTIOUS" ? "MEDIUM" : "LOW",
        notes:
          "Mock generator: abstract framing, simulated reactions, and no real-person targeting."
      }
    };

    // Validate even in the mock to keep the pipeline honest.
    const parsed = issueOutputSchema.parse(output);

    return {
      output: parsed,
      modelName: "mock-generator-v1"
    };
  }
}

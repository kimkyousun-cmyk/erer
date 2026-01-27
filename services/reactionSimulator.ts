import type { EmotionKey, IssueSeed, ReactionSample } from "@/lib/types";
import { pickOne, seededRandom, slugToSeed } from "@/lib/utils";

const templates: Record<EmotionKey, string[]> = {
  anger: [
    "This is exactly how trust gets burned.",
    "They had one job: don't make it worse.",
    "We keep calling this progress but it feels like disrespect.",
    "It's not the feature, it's the attitude behind it.",
    "People warned about this and got called dramatic.",
    "Cool idea, bad boundaries. That's the whole story."
  ],
  humor: [
    "I can't defend this but I *can* laugh at it.",
    "This is going straight into the meme vault.",
    "Who approved this and are they okay?",
    "It's giving 'beta test in public' energy.",
    "Not mad, just entertained in a concerned way.",
    "This might be bad but it is absolutely content."
  ],
  division: [
    "Half the replies are furious, half are clapping.",
    "This depends entirely on which side you started on.",
    "I see both sides and that's somehow illegal now.",
    "The problem is real, the solution is chaotic.",
    "People aren't debating facts, they're defending identity.",
    "This is one of those issues where tone decides everything."
  ]
};

const emotionOrder: EmotionKey[] = ["anger", "division", "humor", "division", "anger", "humor"];

export function simulateReactions(seed: IssueSeed, count = 8): ReactionSample[] {
  const rand = seededRandom(slugToSeed(seed.slug));
  const reactions: ReactionSample[] = [];

  for (let i = 0; i < count; i += 1) {
    const emotion = emotionOrder[i % emotionOrder.length];
    const base = pickOne(templates[emotion], rand);

    reactions.push({
      id: `${seed.slug}-${emotion}-${i}`,
      emotion,
      text: base
    });
  }

  return reactions;
}

import type {
  DominantEmotion,
  EmotionalDrivers,
  EmotionKey,
  EmotionScores,
  Verdict
} from "@/lib/types";
import { clamp, roundScore } from "@/lib/utils";

interface ScoreInputs {
  drivers: EmotionalDrivers;
  velocity: number;
  voteTilt?: {
    agreeDelta: number;
    justifiedDelta: number;
  };
}

// Emotion Radar is intentionally opinionated: scores should *feel* right.
// The weights below are tuned for intuitive outcomes rather than academic rigor.
export function computeEmotionScores({ drivers, velocity, voteTilt }: ScoreInputs): EmotionScores {
  const v = clamp(velocity, 0, 1);

  // Anger spikes when people perceive moral lines being crossed,
  // especially if identity groups feel targeted. Velocity amplifies it.
  const angerRaw =
    drivers.moralViolation * 0.55 +
    drivers.identityConflict * 0.25 +
    drivers.novelty * 0.1 +
    v * 0.1;

  // Humor grows from novelty plus meme potential. Moral violation can *reduce*
  // humor if the vibe is too serious.
  const humorRaw =
    drivers.humorPotential * 0.6 +
    drivers.novelty * 0.25 +
    v * 0.1 -
    drivers.moralViolation * 0.1;

  // Division reflects identity conflict and moral ambiguity. Novelty also
  // widens splits because people haven't formed consensus yet.
  const divisionRaw =
    drivers.identityConflict * 0.5 +
    drivers.moralViolation * 0.2 +
    drivers.novelty * 0.2 +
    v * 0.1;

  let anger = angerRaw * 100;
  let humor = humorRaw * 100;
  let division = divisionRaw * 100;

  // Votes should influence scores, but gently. This keeps the radar reactive
  // without letting brigading dominate the emotional framing.
  if (voteTilt) {
    anger += voteTilt.justifiedDelta * 6 + voteTilt.agreeDelta * 3;
    humor -= voteTilt.justifiedDelta * 2;
    division += Math.abs(voteTilt.agreeDelta) * 4;
  }

  return {
    anger: roundScore(anger),
    humor: roundScore(humor),
    division: roundScore(division)
  };
}

export function dominantEmotion(scores: EmotionScores): DominantEmotion {
  const entries = Object.entries(scores) as Array<[EmotionKey, number]>;
  entries.sort((a, b) => b[1] - a[1]);

  const [topKey, topScore] = entries[0];
  if (topScore < 35) return "calm";
  return topKey;
}

export function verdictFromScores(scores: EmotionScores): Verdict {
  const dominant = dominantEmotion(scores);

  if (dominant === "anger") {
    if (scores.anger > 75) return { label: "This crossed a line", tone: dominant };
    return { label: "Backlash is building", tone: dominant };
  }

  if (dominant === "humor") {
    if (scores.humor > 70) return { label: "Mostly mocked", tone: dominant };
    return { label: "Turned into a meme", tone: dominant };
  }

  if (dominant === "division") {
    if (scores.division > 80) return { label: "People are split", tone: dominant };
    return { label: "Debate mode activated", tone: dominant };
  }

  return { label: "Low signal, watch closely", tone: "calm" };
}

export function trendFromVelocity(velocity: number): "heating" | "cooling" | "stable" {
  if (velocity > 0.72) return "heating";
  if (velocity < 0.38) return "cooling";
  return "stable";
}

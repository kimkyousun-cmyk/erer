import type { IssueSeed } from "@/lib/types";
import { computeEmotionScores, dominantEmotion, trendFromVelocity, verdictFromScores } from "@/lib/scoring";

interface EmotionAnalysisOptions {
  velocity?: number;
  voteTilt?: {
    agreeDelta: number;
    justifiedDelta: number;
  };
}

export function analyzeEmotions(seed: IssueSeed, options: EmotionAnalysisOptions = {}) {
  const velocity = options.velocity ?? seed.baselineVelocity;
  const scores = computeEmotionScores({
    drivers: seed.drivers,
    velocity,
    voteTilt: options.voteTilt
  });

  return {
    scores,
    dominantEmotion: dominantEmotion(scores),
    verdict: verdictFromScores(scores),
    trend: trendFromVelocity(velocity)
  };
}

export type EmotionKey = "anger" | "humor" | "division";

export type EmotionScores = Record<EmotionKey, number>;

export type DominantEmotion = EmotionKey | "calm";

export type TimelinePhaseKey =
  | "trigger"
  | "escalation"
  | "peak"
  | "cooling";

export interface TimelinePhase {
  key: TimelinePhaseKey;
  label: string;
  summary: string;
  intensity: number;
}

export interface EmotionalDrivers {
  novelty: number;
  moralViolation: number;
  identityConflict: number;
  humorPotential: number;
}

export interface IssueSeed {
  slug: string;
  title: string;
  context: string;
  trigger: string;
  tags: string[];
  drivers: EmotionalDrivers;
  baselineVelocity: number;
  timeline: TimelinePhase[];
  baggage: string[];
  culturalContext: string[];
}

export interface Verdict {
  label: string;
  tone: DominantEmotion;
}

export interface ReactionSample {
  id: string;
  emotion: EmotionKey;
  text: string;
}

export interface IssueSummary {
  id: string;
  slug: string;
  title: string;
  context: string;
  scores: EmotionScores;
  dominantEmotion: DominantEmotion;
  verdict: Verdict;
  trend: "heating" | "cooling" | "stable";
  updatedAt: string;
  tags: string[];
}

export interface IssueDetail extends IssueSummary {
  trigger: string;
  timeline: TimelinePhase[];
  reactions: ReactionSample[];
  whyItBlewUp: string[];
  whyPeopleDisagree: {
    sideA: string;
    sideB: string;
  };
  communityPulse: {
    agree: number;
    disagree: number;
    overreaction: number;
    justified: number;
  };
  shorts?: {
    status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
    resultVideoUrl?: string | null;
    updatedAt?: string | null;
    externalRunId?: string | null;
  } | null;
}

export interface VotePayload {
  slug: string;
  agree: boolean;
  justified: boolean;
}

export interface VoteResult {
  slug: string;
  communityPulse: IssueDetail["communityPulse"];
  adjustedScores: EmotionScores;
}

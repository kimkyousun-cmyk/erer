import type { IssueOutput } from "@/lib/validation/generator";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/gi;
const ADDRESS_PATTERN = /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi;
const FULL_NAME_PATTERN = /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g;

const NAME_STOPWORDS = new Set([
  "Platform",
  "Mood",
  "Scores",
  "Profile",
  "Profiles",
  "Update",
  "Issue",
  "Radar",
  "Daily",
  "Emotion",
  "Internet",
  "School",
  "City",
  "Policy",
  "Product",
  "Culture",
  "Workplace",
  "Campus",
  "Game",
  "Delivery",
  "Final",
  "Trigger",
  "Escalation",
  "Peak",
  "Cooling",
  "Reaction"
]);

export interface OutputSafetyResult {
  containsPII: boolean;
  containsSensitiveName: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  notes: string[];
}

function detectPII(text: string) {
  const found = EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text) || ADDRESS_PATTERN.test(text);
  EMAIL_PATTERN.lastIndex = 0;
  PHONE_PATTERN.lastIndex = 0;
  ADDRESS_PATTERN.lastIndex = 0;
  return found;
}

function detectSuspiciousFullName(text: string) {
  let match: RegExpExecArray | null = null;
  FULL_NAME_PATTERN.lastIndex = 0;

  while ((match = FULL_NAME_PATTERN.exec(text)) !== null) {
    const first = match[1];
    const last = match[2];
    if (!NAME_STOPWORDS.has(first) && !NAME_STOPWORDS.has(last)) {
      return true;
    }
  }

  return false;
}

export function evaluateOutputSafety(output: IssueOutput): OutputSafetyResult {
  const combined = [
    output.title,
    output.contextSummary,
    output.verdictLine,
    ...output.timelineEvents.map((e) => `${e.label} ${e.detail}`),
    ...output.reactions.map((r) => r.text)
  ].join("\n");

  const containsPII = detectPII(combined);
  const containsSensitiveName = detectSuspiciousFullName(combined) || output.safety.containsSensitiveName;

  const notes: string[] = [];
  if (containsPII) notes.push("Detected PII-like patterns in generated text");
  if (containsSensitiveName) notes.push("Detected full-name patterns; keep topics abstract");
  if (output.safety.riskLevel !== "LOW") {
    notes.push(`Generator marked risk level as ${output.safety.riskLevel}`);
  }

  const riskLevel: OutputSafetyResult["riskLevel"] = containsPII
    ? "HIGH"
    : containsSensitiveName || output.safety.riskLevel === "HIGH"
      ? "HIGH"
      : output.safety.riskLevel === "MEDIUM"
        ? "MEDIUM"
        : "LOW";

  return {
    containsPII,
    containsSensitiveName,
    riskLevel,
    notes
  };
}

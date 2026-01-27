const URL_PATTERN = /https?:\/\/\S+/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/gi;
const ADDRESS_PATTERN = /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi;

const HARASSMENT_HINTS = [
  "dox",
  "doxx",
  "harass",
  "brigade",
  "swat",
  "leak their address",
  "ruin their life",
  "go after"
];

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
  "Reaction",
  "Escalation",
  "Trigger",
  "Peak",
  "Cooling",
  "A",
  "An",
  "The"
]);

export interface SeedSafetyResult {
  sanitizedText: string;
  removedUrls: boolean;
  containsPII: boolean;
  containsHarassment: boolean;
  containsSuspiciousName: boolean;
  isSafe: boolean;
  rejectReason: string | null;
}

function stripUrls(text: string) {
  const removed = URL_PATTERN.test(text);
  const sanitized = text.replace(URL_PATTERN, " ");
  URL_PATTERN.lastIndex = 0;
  return { sanitized, removed };
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function clampLength(text: string, max = 240) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function includesAny(text: string, hints: string[]) {
  const lower = text.toLowerCase();
  return hints.some((hint) => lower.includes(hint));
}

function detectPII(text: string) {
  return EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text) || ADDRESS_PATTERN.test(text);
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

export function sanitizeSeedText(input: string): SeedSafetyResult {
  const stripped = stripUrls(input);
  const normalized = normalizeWhitespace(stripped.sanitized);
  const clamped = clampLength(normalized);

  const containsPII = detectPII(clamped);
  EMAIL_PATTERN.lastIndex = 0;
  PHONE_PATTERN.lastIndex = 0;
  ADDRESS_PATTERN.lastIndex = 0;

  const containsHarassment = includesAny(clamped, HARASSMENT_HINTS);
  const containsSuspiciousName = detectSuspiciousFullName(clamped);

  let rejectReason: string | null = null;
  if (!clamped) rejectReason = "Empty after sanitization";
  else if (containsPII) rejectReason = "Contains personal data";
  else if (containsHarassment) rejectReason = "Contains harassment language";
  else if (containsSuspiciousName) {
    rejectReason = "Mentions a full name; keep topics abstract";
  }

  return {
    sanitizedText: clamped,
    removedUrls: stripped.removed,
    containsPII,
    containsHarassment,
    containsSuspiciousName,
    isSafe: rejectReason === null,
    rejectReason
  };
}

const keywordTags: Array<{ tag: string; keywords: string[] }> = [
  { tag: "ai", keywords: ["ai", "algorithm", "model", "automation"] },
  { tag: "policy", keywords: ["policy", "law", "ban", "regulation", "tax"] },
  { tag: "education", keywords: ["school", "student", "teacher", "class", "campus"] },
  { tag: "work", keywords: ["work", "office", "manager", "employee", "productivity"] },
  { tag: "social", keywords: ["social", "friend", "message", "chat", "platform"] },
  { tag: "privacy", keywords: ["privacy", "data", "tracking", "surveillance"] },
  { tag: "city-life", keywords: ["city", "urban", "neighborhood", "housing", "rent"] },
  { tag: "gaming", keywords: ["game", "gaming", "player", "stream"] }
];

export function inferTags(text: string) {
  const lower = text.toLowerCase();
  const matches = keywordTags
    .filter((entry) => entry.keywords.some((kw) => lower.includes(kw)))
    .map((entry) => entry.tag);

  const unique = Array.from(new Set(matches));
  return unique.slice(0, 4);
}

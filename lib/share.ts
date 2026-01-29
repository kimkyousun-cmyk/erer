function encode(value: string) {
  return encodeURIComponent(value);
}

export function withUtm(url: string, source: string, medium = "social", campaign = "share") {
  const hasQuery = url.includes("?");
  const utm = `utm_source=${encode(source)}&utm_medium=${encode(medium)}&utm_campaign=${encode(campaign)}`;
  return `${url}${hasQuery ? "&" : "?"}${utm}`;
}

export function shareText(title: string, verdict: string) {
  return `${title} — ${verdict} (Emotion Radar)`;
}

export function shareHashtags(tags?: string[]) {
  const base = ["EmotionRadar", "InternetMood"];
  const tagSet = new Set(base);
  for (const tag of tags ?? []) {
    const cleaned = tag.replace(/[^a-zA-Z0-9]/g, "").trim();
    if (!cleaned) continue;
    tagSet.add(cleaned[0].toUpperCase() + cleaned.slice(1));
  }
  return Array.from(tagSet).slice(0, 6).map((t) => `#${t}`);
}

export function shareLinks(input: { url: string; title: string; verdict: string; tags?: string[] }) {
  const text = shareText(input.title, input.verdict);
  const hashtags = shareHashtags(input.tags).join(" ");
  const payload = `${text} ${hashtags}`.trim();
  const url = input.url;
  return {
    x: `https://x.com/intent/tweet?text=${encode(payload)}&url=${encode(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
    threads: `https://www.threads.net/intent/post?text=${encode(payload + " " + url)}`,
    reddit: `https://www.reddit.com/submit?title=${encode(text)}&url=${encode(url)}`,
    bluesky: `https://bsky.app/intent/compose?text=${encode(payload + " " + url)}`,
    whatsapp: `https://wa.me/?text=${encode(payload + " " + url)}`,
    telegram: `https://t.me/share/url?url=${encode(url)}&text=${encode(payload)}`,
    email: `mailto:?subject=${encode(text)}&body=${encode(payload + "\n\n" + url)}`,
    kakao: `https://story.kakao.com/share?url=${encode(url)}`
  };
}

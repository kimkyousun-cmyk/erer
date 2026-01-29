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

export function shareLinks(input: { url: string; title: string; verdict: string }) {
  const text = shareText(input.title, input.verdict);
  const url = input.url;
  return {
    x: `https://x.com/intent/tweet?text=${encode(text)}&url=${encode(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
    threads: `https://www.threads.net/intent/post?text=${encode(text + " " + url)}`,
    reddit: `https://www.reddit.com/submit?title=${encode(text)}&url=${encode(url)}`,
    kakao: `https://story.kakao.com/share?url=${encode(url)}`
  };
}

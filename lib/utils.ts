export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

export function roundScore(value: number): number {
  return Math.round(clamp(value));
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function slugToSeed(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function pickOne<T>(items: T[], rand: () => number): T {
  const idx = Math.floor(rand() * items.length);
  return items[idx];
}

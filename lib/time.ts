export function utcDateString(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function utcDayRange(date: Date = new Date()): { start: Date; end: Date; dateKey: string } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return {
    start,
    end,
    dateKey: utcDateString(start)
  };
}

export function hoursSince(date: Date | null | undefined, now: Date = new Date()): number {
  if (!date) return Number.POSITIVE_INFINITY;
  const diffMs = now.getTime() - date.getTime();
  return diffMs / (1000 * 60 * 60);
}

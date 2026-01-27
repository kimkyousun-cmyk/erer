const CRON_HEADER = "x-cron-secret";

export function cronSecretConfigured() {
  return Boolean(process.env.CRON_SECRET);
}

export function verifyCronSecret(headers: Headers) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return {
      ok: false,
      reason: "CRON_SECRET is not configured"
    } as const;
  }

  const provided = headers.get(CRON_HEADER);
  if (!provided || provided !== expected) {
    return {
      ok: false,
      reason: "Invalid cron secret"
    } as const;
  }

  return { ok: true } as const;
}

export const cronHeaderName = CRON_HEADER;

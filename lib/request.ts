export function getRequestIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  // Fall back to a stable placeholder for local/dev.
  return "0.0.0.0";
}

export function getUserAgent(headers: Headers): string {
  return headers.get("user-agent") ?? "unknown";
}

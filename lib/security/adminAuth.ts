import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE = "admin_auth";

function secret() {
  return process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminCookieName() {
  return ADMIN_COOKIE;
}

export function requiresAdminPassword() {
  return adminPassword().length > 0;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function issueAdminCookieValue() {
  // The cookie itself never contains the password, only a signed marker.
  return sign("admin-unlocked");
}

export function verifyAdminCookieValue(value: string | undefined | null) {
  if (!value) return false;
  const expected = sign("admin-unlocked");
  try {
    const a = Buffer.from(value);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(input: string) {
  const expected = adminPassword();
  if (!expected) return true;
  try {
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

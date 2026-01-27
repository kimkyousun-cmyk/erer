import { createHmac, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "anon_session_id";

function sessionSecret() {
  return process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
}

export function getOrCreateSessionId() {
  const jar = cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomUUID();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return sessionId;
}

export function sessionHash(sessionId: string) {
  return createHmac("sha256", sessionSecret()).update(sessionId).digest("hex");
}

export function getSessionHash() {
  const id = getOrCreateSessionId();
  return sessionHash(id);
}

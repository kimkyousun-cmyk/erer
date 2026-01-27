import { createHmac } from "node:crypto";

function secret() {
  return process.env.SESSION_SECRET ?? "dev-session-secret-change-me";
}

export function idempotencyKey(scope: string, id: string) {
  const date = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret()).update(`${scope}:${id}:${date}`).digest("hex");
}

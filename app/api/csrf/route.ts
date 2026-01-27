import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { csrfCookieName } from "@/lib/security/csrf";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = randomUUID();
  const res = NextResponse.json({ csrfToken: token });
  res.cookies.set(csrfCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return res;
}

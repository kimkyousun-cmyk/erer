import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth/userSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  clearUserSession();
  const url = new URL(request.url);
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next") : "/";
  return NextResponse.redirect(new URL(next ?? "/", request.url));
}

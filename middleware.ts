import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  adminCookieName,
  requiresAdminPassword,
  verifyAdminCookieValue
} from "@/lib/security/adminAuth";

export function middleware(request: NextRequest) {
  if (!requiresAdminPassword()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  // Allow the admin login page itself.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(adminCookieName())?.value;
  const unlocked = verifyAdminCookieValue(cookie);
  if (unlocked) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  const next = `${pathname}${search}`;
  loginUrl.searchParams.set("next", next);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"]
};

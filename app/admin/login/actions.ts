"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminCookieName,
  issueAdminCookieValue,
  requiresAdminPassword,
  verifyAdminPassword
} from "@/lib/security/adminAuth";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function adminLoginAction(formData: FormData) {
  if (!requiresAdminPassword()) {
    redirect("/admin/issues");
  }

  const password = readString(formData, "password");
  const next = readString(formData, "next");

  if (!verifyAdminPassword(password)) {
    const params = new URLSearchParams({ error: "invalid_password" });
    if (next.startsWith("/")) {
      params.set("next", next);
    }
    redirect(`/admin/login?${params.toString()}`);
  }

  const jar = cookies();
  jar.set(adminCookieName(), issueAdminCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  const safeNext = next.startsWith("/admin") ? next : "/admin/issues";
  redirect(safeNext);
}

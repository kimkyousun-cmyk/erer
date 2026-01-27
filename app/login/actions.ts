"use server";

import { redirect } from "next/navigation";
import { setUserSession } from "@/lib/auth/userSession";
import { getPanicSwitches } from "@/lib/panic";

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function loginAction(formData: FormData) {
  const panic = getPanicSwitches();
  if (panic.disableSignup || panic.readOnlyMode) {
    redirect("/login?error=signup_disabled");
  }

  const emailValue = formData.get("email");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";

  if (!email || !email.includes("@")) {
    redirect("/login?error=invalid_email");
  }

  await setUserSession(email);

  const nextValue = formData.get("next");
  const next = typeof nextValue === "string" && nextValue.startsWith("/") ? nextValue : "/";
  redirect(next);
}

export function readLoginError(searchParams?: Record<string, string | string[] | undefined>) {
  const err = readParam(searchParams?.error);
  if (err === "invalid_email") return "Enter a valid email";
  if (err === "signup_disabled") return "Signups are temporarily disabled";
  return null;
}

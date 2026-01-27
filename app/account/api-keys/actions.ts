"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { getUserSession } from "@/lib/auth/userSession";
import { requireFeature } from "@/services/featureGateService";
import { ApiKeyRepo } from "@/repositories/apiKeyRepo";

const FLASH_COOKIE = "api_key_flash";

function flash(message: string) {
  cookies().set(FLASH_COOKIE, message.slice(0, 400), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60
  });
}

function back(message: string) {
  flash(message);
  redirect("/account/api-keys");
}

export async function createApiKeyAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) back("Invalid CSRF token");

  const session = await getUserSession();
  if (!session) back("Login required");

  const gate = await requireFeature("API_ACCESS");
  if (!gate.ok) back(gate.reason ?? "Upgrade required");

  const nameValue = formData.get("name");
  const name = typeof nameValue === "string" && nameValue.trim() ? nameValue.trim() : "Default key";

  try {
    const { token } = await ApiKeyRepo.create(session.user.id, name);
    back(`New API key (copy now): ${token}`);
  } catch {
    back("Failed to create API key");
  }
}

export async function revokeApiKeyAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) back("Invalid CSRF token");

  const session = await getUserSession();
  if (!session) back("Login required");

  const idValue = formData.get("id");
  const id = typeof idValue === "string" ? idValue : "";
  if (!id) back("Missing key id");

  await ApiKeyRepo.revoke(id);
  back("API key revoked");
}

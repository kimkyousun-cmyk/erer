"use server";

import { revalidatePath } from "next/cache";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { SeedQueueService } from "@/services/seed/seedQueueService";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function addSeedAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) {
    return { ok: false, message: "Invalid CSRF token" };
  }
  const text = getString(formData, "text");
  const sourceTypeRaw = getString(formData, "sourceType");
  const sourceType = sourceTypeRaw === "RSS" ? "RSS" : sourceTypeRaw === "USER_SUBMIT" ? "USER_SUBMIT" : "MANUAL";

  const result = await SeedQueueService.createFromAdmin({ text, sourceType });
  revalidatePath("/admin/seeds");
  return result;
}

export async function rejectSeedAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) {
    return { ok: false, message: "Invalid CSRF token" };
  }
  const id = getString(formData, "id");
  const reason = getString(formData, "reason") || "Rejected by editor";
  if (!id) return { ok: false, message: "Missing seed id" };

  const result = await SeedQueueService.reject(id, reason);
  revalidatePath("/admin/seeds");
  return result;
}

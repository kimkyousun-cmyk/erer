"use server";

import { revalidatePath } from "next/cache";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { UserRepo } from "@/repositories/userRepo";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function setPlanAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) {
    return { ok: false, message: "Invalid CSRF token" };
  }

  const userId = getString(formData, "userId");
  const planRaw = getString(formData, "plan");
  const plan = planRaw === "PRO" ? "PRO" : "FREE";

  if (!userId) {
    return { ok: false, message: "Missing user id" };
  }

  await UserRepo.setPlan(userId, plan);
  revalidatePath("/admin/users");
  return { ok: true, message: `Plan set to ${plan}` };
}

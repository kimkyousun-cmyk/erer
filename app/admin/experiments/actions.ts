"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { ExperimentRepo, type VariantDef } from "@/repositories/experimentRepo";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function back(ok: boolean, message: string) {
  const params = new URLSearchParams({ ok: ok ? "1" : "0", message: message.slice(0, 200) });
  redirect(`/admin/experiments?${params.toString()}`);
}

function parseVariants(raw: string): VariantDef[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const variants: VariantDef[] = [];

  for (const line of lines) {
    const [nameRaw, weightRaw] = line.split(":");
    const name = (nameRaw ?? "").trim();
    const weight = Number.parseInt((weightRaw ?? "").trim(), 10);
    if (!name || !Number.isFinite(weight) || weight <= 0) {
      continue;
    }
    variants.push({ name, weight });
  }

  if (variants.length === 0) {
    return [
      { name: "control", weight: 50 },
      { name: "variantA", weight: 50 }
    ];
  }

  return variants.slice(0, 8);
}

export async function upsertExperimentAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) {
    back(false, "Invalid CSRF token");
  }

  const key = getString(formData, "key").trim().toUpperCase();
  if (!key) {
    back(false, "Experiment key is required");
  }

  const status = getString(formData, "status") as "DRAFT" | "RUNNING" | "PAUSED" | "ENDED";
  const variants = parseVariants(getString(formData, "variants"));

  try {
    await ExperimentRepo.upsertExperiment({
      key,
      status: status || "DRAFT",
      variants,
      targetingJson: null
    });

    revalidatePath("/admin/experiments");
    back(true, `Saved experiment ${key}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save experiment";
    back(false, message);
  }
}

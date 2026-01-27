"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { EditorialService } from "@/services/issues/editorialService";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : 0;
}

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2)
    .slice(0, 5);
}

function backToEditor(id: string, ok: boolean, message: string) {
  const params = new URLSearchParams({
    ok: ok ? "1" : "0",
    message: message.slice(0, 160)
  });
  redirect(`/admin/issues/${id}?${params.toString()}`);
}

export async function updateIssueAction(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) backToEditor("unknown", false, "Missing issue id");

  if (!verifyCsrfToken(formData)) {
    backToEditor(id, false, "Invalid CSRF token");
  }

  try {
    const tags = parseTags(getString(formData, "tags"));
    await EditorialService.updateIssue({
      id,
      title: getString(formData, "title"),
      contextSummary: getString(formData, "contextSummary"),
      verdictLine: getString(formData, "verdictLine"),
      dominantEmotion: getString(formData, "dominantEmotion") as
        | "ANGER"
        | "HUMOR"
        | "DIVISION"
        | "MIXED",
      angerScore: getNumber(formData, "angerScore"),
      humorScore: getNumber(formData, "humorScore"),
      divisionScore: getNumber(formData, "divisionScore"),
      tags,
      note: getString(formData, "note") || undefined
    });

    revalidatePath("/admin/issues");
    revalidatePath(`/admin/issues/${id}`);

    backToEditor(id, true, "Issue updated");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    backToEditor(id, false, message);
  }
}

export async function transitionIssueAction(formData: FormData) {
  const id = getString(formData, "id");
  const toStatus = getString(formData, "toStatus");
  if (!id) backToEditor("unknown", false, "Missing issue id");

  if (!verifyCsrfToken(formData)) {
    backToEditor(id, false, "Invalid CSRF token");
  }

  try {
    await EditorialService.transitionStatus({
      id,
      toStatus: toStatus as "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED",
      note: getString(formData, "note") || undefined
    });

    revalidatePath("/admin/issues");
    revalidatePath(`/admin/issues/${id}`);

    backToEditor(id, true, `Status changed to ${toStatus}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status change failed";
    backToEditor(id, false, message);
  }
}

export async function regenerateReactionsAction(formData: FormData) {
  const id = getString(formData, "id");
  if (!id) backToEditor("unknown", false, "Missing issue id");

  if (!verifyCsrfToken(formData)) {
    backToEditor(id, false, "Invalid CSRF token");
  }

  try {
    const count = await EditorialService.regenerateReactions(id);
    revalidatePath(`/admin/issues/${id}`);
    backToEditor(id, true, `Regenerated ${count} reactions`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reactions regeneration failed";
    backToEditor(id, false, message);
  }
}

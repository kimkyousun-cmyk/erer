"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyCsrfToken } from "@/lib/security/csrf";
import { EditorialService } from "@/services/issues/editorialService";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWith(result: { ok: boolean; message: string }) {
  const params = new URLSearchParams({
    ok: result.ok ? "1" : "0",
    message: result.message.slice(0, 160)
  });
  redirect(`/admin/issue-intake?${params.toString()}`);
}

export async function intakeIssueAction(formData: FormData) {
  if (!verifyCsrfToken(formData)) {
    redirectWith({ ok: false, message: "Invalid CSRF token" });
  }

  const seedText = getString(formData, "seedText");
  const sensitivityRaw = getString(formData, "sensitivity");
  const tagsRaw = getString(formData, "tags");

  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 5);

  try {
    const result = await EditorialService.intakeIssue({
      seedText,
      sensitivity: sensitivityRaw === "CAUTIOUS" ? "CAUTIOUS" : "SAFE",
      tags
    });

    revalidatePath("/admin/issues");
    revalidatePath("/admin/jobs");

    redirect(
      `/admin/issues/${result.issueId}?ok=1&message=${encodeURIComponent(
        "Draft generated successfully"
      )}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Intake failed";
    redirectWith({ ok: false, message });
  }
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SeedQueueService } from "@/services/seed/seedQueueService";

function buildRedirectUrl(result: {
  ok: boolean;
  message: string;
  status?: "PENDING" | "REJECTED";
  rejectReason?: string;
}) {
  const params = new URLSearchParams();
  params.set("ok", result.ok ? "1" : "0");
  params.set("message", result.message.slice(0, 160));
  if (result.status) params.set("status", result.status);
  if (result.rejectReason) params.set("reason", result.rejectReason.slice(0, 120));
  return `/submit?${params.toString()}`;
}

export async function submitSeedAction(formData: FormData) {
  const textValue = formData.get("text");
  const text = typeof textValue === "string" ? textValue : "";

  const result = await SeedQueueService.submitFromPublic({ text }, headers());
  redirect(buildRedirectUrl(result));
}

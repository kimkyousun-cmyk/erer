"use client";

import type { EventName } from "@/lib/validation/event";

export interface TrackClientEvent {
  eventName: EventName;
  issueId?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean | null>;
}

// Fire-and-forget client event tracker. Swallows errors by design.
export async function trackClientEvent(event: TrackClientEvent) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(event),
      cache: "no-store",
      keepalive: true
    });
  } catch {
    // Intentionally ignore analytics failures to avoid UX regressions.
  }
}

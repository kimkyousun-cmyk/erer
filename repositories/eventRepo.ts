import type { TrackEventInput } from "@/lib/validation/event";

function serializeTags(tags?: string[]) {
  if (!tags || tags.length === 0) {
    return undefined;
  }
  const unique = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
  return unique.join(",");
}

function serializeMetadata(metadata?: TrackEventInput["metadata"]) {
  if (!metadata) {
    return undefined;
  }
  try {
    return JSON.stringify(metadata);
  } catch {
    return undefined;
  }
}

export interface CreateEventInput extends TrackEventInput {
  sessionHash: string;
  userId?: string | null;
}

export const EventRepo = {
  async createEvent(input: CreateEventInput) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.event.create({
      data: {
        sessionHash: input.sessionHash,
        userId: input.userId ?? null,
        eventName: input.eventName,
        issueId: input.issueId ?? null,
        tags: serializeTags(input.tags),
        metadataJson: serializeMetadata(input.metadata)
      }
    });
  }
};

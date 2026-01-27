import { z } from "zod";

export const eventNames = [
  "ISSUE_CARD_VIEW",
  "ISSUE_OPEN",
  "ISSUE_SCROLL_25",
  "ISSUE_SCROLL_75",
  "VOTE_SUBMIT",
  "SHARE_CLICK",
  "EXPORT_CLICK",
  "ISSUE_FEEDBACK",
  "SEARCH_QUERY",
  "EXPERIMENT_EXPOSURE"
] as const;

export type EventName = (typeof eventNames)[number];

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9-_/]+$/i, "Tags must be simple slugs.");

const metadataSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .refine((obj) => Object.keys(obj).length <= 16, "Metadata too large.");

export const trackEventInputSchema = z.object({
  eventName: z.enum(eventNames),
  issueId: z.string().cuid().optional(),
  tags: z.array(tagSchema).max(8).optional(),
  metadata: metadataSchema.optional()
});

export type TrackEventInput = z.infer<typeof trackEventInputSchema>;

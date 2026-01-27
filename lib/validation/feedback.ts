import { z } from "zod";

export const feedbackTypes = [
  "CONFUSING",
  "BIASED",
  "LOW_QUALITY",
  "REPETITIVE",
  "GREAT"
] as const;

export const feedbackInputSchema = z.object({
  type: z.enum(feedbackTypes),
  note: z.string().trim().max(200).optional()
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

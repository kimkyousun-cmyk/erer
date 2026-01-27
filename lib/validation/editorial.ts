import { z } from "zod";
import { dominantEmotionSchema } from "@/lib/validation/generator";

export const editorialUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().trim().min(8).max(60),
  contextSummary: z.string().trim().min(20).max(240),
  verdictLine: z.string().trim().min(8).max(70),
  dominantEmotion: dominantEmotionSchema,
  angerScore: z.number().int().min(0).max(100),
  humorScore: z.number().int().min(0).max(100),
  divisionScore: z.number().int().min(0).max(100),
  tags: z.array(z.string().trim().min(2).max(24)).min(1).max(5),
  note: z.string().trim().max(200).optional()
});

export const issueIntakeSchema = z.object({
  seedText: z.string().trim().min(12).max(400),
  tags: z.array(z.string().trim().min(2).max(24)).max(5).default([]),
  sensitivity: z.enum(["SAFE", "CAUTIOUS"]).default("SAFE")
});

export const statusTransitionSchema = z.object({
  id: z.string().cuid(),
  toStatus: z.enum(["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"]),
  note: z.string().trim().max(200).optional()
});

export type EditorialUpdateInput = z.infer<typeof editorialUpdateSchema>;
export type IssueIntakeInput = z.infer<typeof issueIntakeSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;

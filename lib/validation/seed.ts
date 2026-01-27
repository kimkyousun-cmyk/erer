import { z } from "zod";

export const seedSourceTypeSchema = z.enum(["MANUAL", "USER_SUBMIT", "RSS"]);
export const seedStatusSchema = z.enum(["PENDING", "USED", "REJECTED"]);

export const seedTextSchema = z
  .string()
  .trim()
  .min(8, "Please enter at least 8 characters")
  .max(400, "Keep it under 400 characters");

export const adminCreateSeedSchema = z.object({
  text: seedTextSchema,
  sourceType: seedSourceTypeSchema.default("MANUAL")
});

export const publicSubmitSeedSchema = z.object({
  text: seedTextSchema
});

export type AdminCreateSeedInput = z.infer<typeof adminCreateSeedSchema>;
export type PublicSubmitSeedInput = z.infer<typeof publicSubmitSeedSchema>;

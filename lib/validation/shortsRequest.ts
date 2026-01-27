import { z } from "zod";

export const shortsPackageRequestSchema = z
  .object({
    issueId: z.string().cuid().optional(),
    seedText: z.string().trim().min(12).max(400).optional()
  })
  .refine((v) => Boolean(v.issueId || v.seedText), {
    message: "Provide issueId or seedText",
    path: ["issueId"]
  });

export type ShortsPackageRequest = z.infer<typeof shortsPackageRequestSchema>;

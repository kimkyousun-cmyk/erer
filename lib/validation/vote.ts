import { z } from "zod";

export const votePayloadSchema = z.object({
  slug: z.string().trim().min(2).max(120),
  agree: z.boolean(),
  justified: z.boolean()
});

export type VotePayloadInput = z.infer<typeof votePayloadSchema>;

import { z } from "zod";

export const followInputSchema = z.object({
  tag: z.string().trim().min(2).max(40),
  action: z.enum(["follow", "unfollow"]).default("follow")
});

export type FollowInput = z.infer<typeof followInputSchema>;

import { z } from "zod";

export const shortsSendSchema = z.object({
  issueId: z.string().cuid()
});

export type ShortsSendInput = z.infer<typeof shortsSendSchema>;

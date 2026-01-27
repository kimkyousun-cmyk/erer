import { z } from "zod";

export const n8nWebhookSchema = z.object({
  issueId: z.string().cuid(),
  jobId: z.string().cuid().optional(),
  status: z.enum(["QUEUED", "RUNNING", "SUCCEEDED", "FAILED"]),
  externalRunId: z.string().min(2).max(120).optional(),
  resultVideoUrl: z.string().url().optional(),
  assets: z.record(z.unknown()).optional(),
  error: z.string().max(400).optional()
});

export type N8nWebhookPayload = z.infer<typeof n8nWebhookSchema>;

import { z } from "zod";

const frameSchema = z.object({
  frame_number: z.number().int().min(1).max(8),
  scene_description: z.string().trim().min(8).max(160),
  prompt: z.string().trim().min(20).max(320),
  character: z.enum(["female", "male", "both", "none"]),
  emotion: z.string().trim().min(2).max(40),
  background_color: z.string().trim().min(2).max(40)
});

export const shortsPackageSchema = z.object({
  id: z.string().min(2).max(120),
  title: z.string().trim().min(4).max(20),
  hook_text: z.string().trim().min(2).max(15),
  gender: z.enum(["남성", "여성"]),
  script: z.object({
    full_text: z.string().trim().min(200).max(290)
  }),
  image_prompts: z.array(frameSchema).length(8),
  metadata: z.object({
    category: z.string().trim().min(2).max(40),
    target_emotion: z.string().trim().min(2).max(40),
    comment_inducing_question: z.string().trim().min(8).max(120),
    hashtags: z.array(z.string().trim().min(2).max(40)).min(3).max(12),
    thumbnail_text: z.array(z.string().trim().min(2).max(24)).min(2).max(6)
  })
});

export type ShortsPackage = z.infer<typeof shortsPackageSchema>;

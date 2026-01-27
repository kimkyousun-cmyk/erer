import { z } from "zod";

export const dominantEmotionSchema = z.enum(["ANGER", "HUMOR", "DIVISION", "MIXED"]);
export const timelinePhaseSchema = z.enum(["TRIGGER", "ESCALATION", "PEAK", "COOLING"]);
export const reactionEmotionSchema = z.enum(["ANGER", "HUMOR", "DIVISION", "SUPPORT", "NEUTRAL"]);

const timelineEventSchema = z.object({
  phase: timelinePhaseSchema,
  label: z.string().trim().min(2).max(40),
  detail: z.string().trim().min(12).max(180),
  order: z.number().int().min(0).max(10)
});

const reactionSchema = z.object({
  emotionType: reactionEmotionSchema,
  intensity: z.number().int().min(1).max(5),
  text: z.string().trim().min(8).max(200)
});

export const safetySchema = z.object({
  containsSensitiveName: z.boolean(),
  containsPII: z.boolean(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  notes: z.string().trim().min(2).max(240)
});

export const issueOutputSchema = z
  .object({
    title: z.string().trim().min(8).max(60),
    contextSummary: z.string().trim().min(20).max(240),
    verdictLine: z.string().trim().min(8).max(70),
    dominantEmotion: dominantEmotionSchema,
    angerScore: z.number().int().min(0).max(100),
    humorScore: z.number().int().min(0).max(100),
    divisionScore: z.number().int().min(0).max(100),
    tags: z.array(z.string().trim().min(2).max(24)).min(1).max(5),
    timelineEvents: z.array(timelineEventSchema).length(4),
    reactions: z.array(reactionSchema).min(8).max(12),
    safety: safetySchema
  })
  .superRefine((value, ctx) => {
    const phases = value.timelineEvents.map((e) => e.phase);
    const required: Array<z.infer<typeof timelinePhaseSchema>> = [
      "TRIGGER",
      "ESCALATION",
      "PEAK",
      "COOLING"
    ];

    for (const phase of required) {
      if (!phases.includes(phase)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["timelineEvents"],
          message: `Missing timeline phase: ${phase}`
        });
      }
    }
  });

export type IssueOutput = z.infer<typeof issueOutputSchema>;

import { z } from "zod";
import { isDemoMode } from "@/lib/demo";
import { getSessionHash } from "@/lib/security/session";
import { EventRepo } from "@/repositories/eventRepo";
import { ExperimentRepo, type VariantDef } from "@/repositories/experimentRepo";
import { logger } from "@/lib/log";

const variantSchema = z.object({
  name: z.string().trim().min(1).max(40),
  weight: z.number().int().min(1).max(1000)
});

const variantsSchema = z
  .array(variantSchema)
  .min(1)
  .max(8)
  .refine((variants) => new Set(variants.map((v) => v.name)).size === variants.length, {
    message: "Variant names must be unique."
  });

export function ensureControlVariant(variants: VariantDef[]) {
  if (variants.some((v) => v.name === "control")) return variants;
  return [{ name: "control", weight: 1 }, ...variants];
}

export function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function chooseVariant(variants: VariantDef[], seed: string) {
  const total = variants.reduce((sum, v) => sum + v.weight, 0);
  const bucket = hashString(seed) % total;
  let cursor = 0;
  for (const variant of variants) {
    cursor += variant.weight;
    if (bucket < cursor) return variant.name;
  }
  return variants[0]?.name ?? "control";
}

export interface VariantResult {
  experimentKey: string;
  variant: string;
  experimentId: string | null;
  active: boolean;
}

export const ExperimentService = {
  async getVariant(experimentKey: string): Promise<VariantResult> {
    if (isDemoMode()) {
      return {
        experimentKey,
        variant: "control",
        experimentId: null,
        active: false
      };
    }

    const sessionHash = getSessionHash();

    const experiment = await ExperimentRepo.getByKey(experimentKey);
    if (!experiment || experiment.status !== "RUNNING") {
      return {
        experimentKey,
        variant: "control",
        experimentId: experiment?.id ?? null,
        active: false
      };
    }

    const parsedVariants = variantsSchema.safeParse(ensureControlVariant(experiment.variants));
    const variants = parsedVariants.success ? parsedVariants.data : [{ name: "control", weight: 1 }];

    const existing = await ExperimentRepo.getAssignment(experiment.id, sessionHash);
    const variantName = existing?.variantName ?? chooseVariant(variants, `${experimentKey}:${sessionHash}`);

    if (!existing) {
      try {
        await ExperimentRepo.upsertAssignment({
          experimentId: experiment.id,
          sessionHash,
          variantName
        });
      } catch (err) {
        logger.warn("experiment.assignment_upsert_failed", {
          experimentKey,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    try {
      await EventRepo.createEvent({
        sessionHash,
        eventName: "EXPERIMENT_EXPOSURE",
        metadata: {
          experimentKey,
          variant: variantName
        }
      });
    } catch (err) {
      logger.warn("experiment.exposure_event_failed", {
        experimentKey,
        variant: variantName,
        error: err instanceof Error ? err.message : String(err)
      });
    }

    return {
      experimentKey,
      variant: variantName,
      experimentId: experiment.id,
      active: true
    };
  }
};

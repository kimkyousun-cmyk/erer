import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/log";
import { ensureUniqueSlug } from "@/lib/slug";
import { sanitizeSeedText } from "@/lib/safety/seedSafety";
import { evaluateOutputSafety } from "@/lib/safety/outputSafety";
import { issueOutputSchema, type IssueOutput } from "@/lib/validation/generator";
import { IssueRepo } from "@/repositories/issueRepo";
import { SeedRepo } from "@/repositories/seedRepo";
import { getGenerator } from "@/services/generator/generatorFactory";
import type { SensitivityLevel } from "@/services/generator/generatorTypes";
import { QualityService } from "@/services/dq/qualityService";
import { assertNotDisabled, getPanicSwitches } from "@/lib/panic";

export interface GenerationPipelineInput {
  seedId?: string;
  seedText: string;
  tags?: string[];
  sensitivity?: SensitivityLevel;
  actor?: string;
}

export interface GenerationPipelineResult {
  issueId: string;
  slug: string;
  requiresEdit: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  safetyNotes: string[];
}

function mergeTags(outputTags: string[], inputTags: string[] | undefined) {
  const merged = [...outputTags, ...(inputTags ?? [])]
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length >= 2);

  const unique = Array.from(new Set(merged));
  return unique.slice(0, 5);
}

function deriveRequiresEdit(output: IssueOutput) {
  const safety = evaluateOutputSafety(output);
  const requiresEdit = safety.riskLevel !== "LOW" || safety.containsPII || safety.containsSensitiveName;

  return {
    requiresEdit,
    safety
  };
}

export async function runGenerationPipeline(input: GenerationPipelineInput): Promise<GenerationPipelineResult> {
  const panic = getPanicSwitches();
  assertNotDisabled(panic.disableGeneration || panic.readOnlyMode, "Generation is temporarily disabled");

  const sanitizedSeed = sanitizeSeedText(input.seedText);

  if (!sanitizedSeed.sanitizedText) {
    throw new Error("Seed is empty after sanitization");
  }

  const sensitivity = input.sensitivity ?? "SAFE";
  const generator = getGenerator();

  logger.info("generation.start", {
    seedId: input.seedId,
    actor: input.actor ?? "system",
    sensitivity,
    seedPreview: sanitizedSeed.sanitizedText.slice(0, 80)
  });

  const genResult = await generator.generateIssue({
    seedText: sanitizedSeed.sanitizedText,
    tags: input.tags ?? [],
    sensitivity
  });

  const parsed = issueOutputSchema.parse(genResult.output);
  const slug = await ensureUniqueSlug(parsed.title);

  const tagList = mergeTags(parsed.tags, input.tags);
  const { requiresEdit, safety } = deriveRequiresEdit(parsed);

  const issue = await IssueRepo.createDraft({
    slug,
    title: parsed.title,
    contextSummary: parsed.contextSummary,
    verdictLine: parsed.verdictLine,
    dominantEmotion: parsed.dominantEmotion,
    angerScore: parsed.angerScore,
    humorScore: parsed.humorScore,
    divisionScore: parsed.divisionScore,
    tags: tagList,
    requiresEdit,
    timelineEvents: parsed.timelineEvents,
    reactions: parsed.reactions
  });

  const safetyNotes = [
    ...safety.notes,
    sanitizedSeed.removedUrls ? "URLs were stripped from seed text" : null,
    sanitizedSeed.containsSuspiciousName ? "Seed included a full-name pattern" : null
  ].filter(Boolean) as string[];

  await prisma.issueGenerationLog.create({
    data: {
      issueId: issue.id,
      inputText: sanitizedSeed.sanitizedText,
      outputJson: JSON.stringify({
        ...parsed,
        safetyEvaluation: safety,
        safetyNotes
      }),
      modelName: genResult.modelName
    }
  });

  // Run data-quality checks on draft creation. Failures should not block draft creation.
  try {
    const dq = await QualityService.runAndStore(issue.id, "ON_CREATE");
    const dqRequiresEdit = dq.evaluation.action !== "PASS";
    if (dqRequiresEdit && !issue.requiresEdit) {
      await IssueRepo.updateDraft(issue.id, { requiresEdit: true, incrementVersion: false });
    }
  } catch (err) {
    logger.warn("generation.dq_failed", {
      issueId: issue.id,
      error: err instanceof Error ? err.message : String(err)
    });
  }

  if (input.seedId) {
    try {
      await SeedRepo.markUsed(input.seedId);
    } catch (err) {
      logger.warn("generation.seed_mark_used_failed", {
        seedId: input.seedId,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  logger.info("generation.completed", {
    issueId: issue.id,
    slug,
    requiresEdit,
    riskLevel: safety.riskLevel
  });

  return {
    issueId: issue.id,
    slug,
    requiresEdit,
    riskLevel: safety.riskLevel,
    safetyNotes
  };
}

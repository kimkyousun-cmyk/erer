import { logger } from "@/lib/log";
import { inferTags } from "@/lib/tags";
import { SeedRepo } from "@/repositories/seedRepo";
import { runGenerationPipeline } from "@/services/generator/generationPipeline";

export interface HourlyIssueDraftJobResult {
  createdDrafts: number;
  usedSeedIds: string[];
  skippedSeedIds: string[];
}

export async function runHourlyIssueDraftJob(): Promise<HourlyIssueDraftJobResult> {
  const seeds = await SeedRepo.list({ status: "PENDING", take: 12 });
  if (seeds.length === 0) {
    logger.info("hourly_issue_draft_job.no_seeds");
    return { createdDrafts: 0, usedSeedIds: [], skippedSeedIds: [] };
  }

  const targetCount = Math.min(3, Math.max(1, Math.floor(seeds.length / 4)));
  const picked = seeds.slice(0, targetCount);

  const usedSeedIds: string[] = [];
  const skippedSeedIds: string[] = [];

  for (const seed of picked) {
    try {
      const tags = inferTags(seed.text);
      const result = await runGenerationPipeline({
        seedId: seed.id,
        seedText: seed.text,
        tags,
        sensitivity: "SAFE",
        actor: "hourly-cron"
      });
      usedSeedIds.push(seed.id);
      logger.info("hourly_issue_draft_job.created", {
        seedId: seed.id,
        issueId: result.issueId,
        slug: result.slug,
        requiresEdit: result.requiresEdit
      });
    } catch (err) {
      skippedSeedIds.push(seed.id);
      logger.error("hourly_issue_draft_job.failed_seed", err, {
        seedId: seed.id
      });
    }
  }

  return {
    createdDrafts: usedSeedIds.length,
    usedSeedIds,
    skippedSeedIds
  };
}

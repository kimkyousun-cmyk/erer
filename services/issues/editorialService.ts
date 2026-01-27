import { logger } from "@/lib/log";
import { evaluateOutputSafety } from "@/lib/safety/outputSafety";
import { issueOutputSchema, type IssueOutput } from "@/lib/validation/generator";
import {
  editorialUpdateSchema,
  issueIntakeSchema,
  statusTransitionSchema,
  type EditorialUpdateInput,
  type IssueIntakeInput,
  type StatusTransitionInput
} from "@/lib/validation/editorial";
import { AuditService } from "@/services/audit/auditService";
import { runGenerationPipeline } from "@/services/generator/generationPipeline";
import { getGenerator } from "@/services/generator/generatorFactory";
import { IssueRepo } from "@/repositories/issueRepo";
import { IssueService } from "@/services/issues/issueService";
import { QualityService } from "@/services/dq/qualityService";
import { RevisionRepo } from "@/repositories/revisionRepo";
import { NotificationService } from "@/services/notifications/notificationService";

const ACTOR = "local-admin";

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 5);
}

function allowUnsafePublish() {
  return (process.env.ALLOW_UNSAFE_PUBLISH ?? "false").toLowerCase() === "true";
}

function diffSummary(before: {
  title: string;
  contextSummary: string;
  verdictLine: string;
  dominantEmotion: string;
  angerScore: number;
  humorScore: number;
  divisionScore: number;
  tags: string;
}, after: {
  title: string;
  contextSummary: string;
  verdictLine: string;
  dominantEmotion: string;
  angerScore: number;
  humorScore: number;
  divisionScore: number;
  tags: string;
}) {
  const changes: string[] = [];
  if (before.title !== after.title) changes.push("title");
  if (before.contextSummary !== after.contextSummary) changes.push("context");
  if (before.verdictLine !== after.verdictLine) changes.push("verdict");
  if (before.dominantEmotion !== after.dominantEmotion) changes.push("dominant_emotion");
  if (before.angerScore !== after.angerScore) changes.push("anger");
  if (before.humorScore !== after.humorScore) changes.push("humor");
  if (before.divisionScore !== after.divisionScore) changes.push("division");
  if (before.tags !== after.tags) changes.push("tags");
  return changes.length > 0 ? `Edited: ${changes.join(", ")}` : "Edited: no visible field changes";
}

function toOutputShape(input: {
  title: string;
  contextSummary: string;
  verdictLine: string;
  dominantEmotion: "ANGER" | "HUMOR" | "DIVISION" | "MIXED";
  angerScore: number;
  humorScore: number;
  divisionScore: number;
  tags: string[];
  timelineEvents: Array<{ phase: string; label: string; detail: string; order: number }>;
  reactions: Array<{ emotionType: string; text: string; intensity: number }>;
}): IssueOutput {
  return issueOutputSchema.parse({
    title: input.title,
    contextSummary: input.contextSummary,
    verdictLine: input.verdictLine,
    dominantEmotion: input.dominantEmotion,
    angerScore: input.angerScore,
    humorScore: input.humorScore,
    divisionScore: input.divisionScore,
    tags: input.tags,
    timelineEvents: input.timelineEvents.map((e) => ({
      phase: e.phase as IssueOutput["timelineEvents"][number]["phase"],
      label: e.label,
      detail: e.detail,
      order: e.order
    })),
    reactions: input.reactions.map((r) => ({
      emotionType: r.emotionType as IssueOutput["reactions"][number]["emotionType"],
      text: r.text,
      intensity: r.intensity
    })),
    safety: {
      containsSensitiveName: false,
      containsPII: false,
      riskLevel: "LOW",
      notes: "Manual editorial safety evaluation"
    }
  });
}

export const EditorialService = {
  async intakeIssue(input: IssueIntakeInput) {
    const parsed = issueIntakeSchema.parse(input);
    const result = await runGenerationPipeline({
      seedText: parsed.seedText,
      tags: parsed.tags,
      sensitivity: parsed.sensitivity,
      actor: ACTOR
    });

    await AuditService.record({
      action: "ISSUE_INTAKE",
      entityType: "Issue",
      entityId: result.issueId,
      issueId: result.issueId,
      note: `Generated draft (risk=${result.riskLevel})`
    });

    IssueService.invalidateIssueCaches();
    return result;
  },

  async updateIssue(input: EditorialUpdateInput) {
    const parsed = editorialUpdateSchema.parse(input);
    const issue = await IssueRepo.getById(parsed.id);
    if (!issue) throw new Error("Issue not found");

    const before = {
      title: issue.title,
      contextSummary: issue.contextSummary,
      verdictLine: issue.verdictLine,
      dominantEmotion: issue.dominantEmotion,
      angerScore: issue.angerScore,
      humorScore: issue.humorScore,
      divisionScore: issue.divisionScore,
      tags: issue.tags,
      requiresEdit: issue.requiresEdit,
      status: issue.status
    };

    const updated = await IssueRepo.updateDraft(parsed.id, {
      title: parsed.title,
      contextSummary: parsed.contextSummary,
      verdictLine: parsed.verdictLine,
      dominantEmotion: parsed.dominantEmotion,
      angerScore: parsed.angerScore,
      humorScore: parsed.humorScore,
      divisionScore: parsed.divisionScore,
      tags: parsed.tags
    });

    const outputShape = toOutputShape({
      title: updated.title,
      contextSummary: updated.contextSummary,
      verdictLine: updated.verdictLine,
      dominantEmotion: updated.dominantEmotion as IssueOutput["dominantEmotion"],
      angerScore: updated.angerScore,
      humorScore: updated.humorScore,
      divisionScore: updated.divisionScore,
      tags: parseTags(updated.tags),
      timelineEvents: issue.timelineEvents,
      reactions: issue.reactions
    });

    const safety = evaluateOutputSafety(outputShape);
    const safetyRequiresEdit = safety.riskLevel !== "LOW";
    if (safetyRequiresEdit !== updated.requiresEdit) {
      await IssueRepo.updateDraft(parsed.id, { requiresEdit: safetyRequiresEdit, incrementVersion: false });
    }

    if (updated.version > issue.version) {
      const summary = parsed.note?.trim() || diffSummary(before, {
        title: updated.title,
        contextSummary: updated.contextSummary,
        verdictLine: updated.verdictLine,
        dominantEmotion: updated.dominantEmotion,
        angerScore: updated.angerScore,
        humorScore: updated.humorScore,
        divisionScore: updated.divisionScore,
        tags: updated.tags
      });
      await RevisionRepo.createRevision({
        issueId: parsed.id,
        fromVersion: issue.version,
        toVersion: updated.version,
        diffSummary: summary
      });
    }

    let finalRequiresEdit = safetyRequiresEdit;

    try {
      const dq = await QualityService.runAndStore(parsed.id, "ON_CREATE");
      const dqRequiresEdit = dq.evaluation.action !== "PASS";
      const nextRequiresEdit = safetyRequiresEdit || dqRequiresEdit;
      if (nextRequiresEdit !== updated.requiresEdit) {
        await IssueRepo.updateDraft(parsed.id, { requiresEdit: nextRequiresEdit, incrementVersion: false });
      }
      finalRequiresEdit = nextRequiresEdit;
    } catch (err) {
      logger.warn("editorial.update_dq_failed", {
        issueId: parsed.id,
        error: err instanceof Error ? err.message : String(err)
      });
    }

    await AuditService.record({
      action: "ISSUE_EDIT",
      entityType: "Issue",
      entityId: parsed.id,
      issueId: parsed.id,
      before,
      after: {
        title: updated.title,
        contextSummary: updated.contextSummary,
        verdictLine: updated.verdictLine,
        dominantEmotion: updated.dominantEmotion,
        angerScore: updated.angerScore,
          humorScore: updated.humorScore,
          divisionScore: updated.divisionScore,
          tags: updated.tags,
          requiresEdit: finalRequiresEdit
        },
        note: parsed.note ?? null
      });

    IssueService.invalidateIssueCaches(updated.slug);
    return { updated, safety, requiresEdit: finalRequiresEdit };
  },

  async transitionStatus(input: StatusTransitionInput) {
    const parsed = statusTransitionSchema.parse(input);
    const issue = await IssueRepo.getById(parsed.id);
    if (!issue) throw new Error("Issue not found");

    const before = { status: issue.status, requiresEdit: issue.requiresEdit };

    if (parsed.toStatus === "IN_REVIEW") {
      const updated = await IssueRepo.moveToReview(parsed.id);
      await AuditService.record({
        action: "ISSUE_REVIEW",
        entityType: "Issue",
        entityId: parsed.id,
        issueId: parsed.id,
        before,
        after: { status: updated.status },
        note: parsed.note ?? null
      });
      IssueService.invalidateIssueCaches(updated.slug);
      return updated;
    }

    if (parsed.toStatus === "PUBLISHED") {
      const dq = await QualityService.runAndStore(parsed.id, "ON_PUBLISH");
      const dqRequiresEdit = dq.evaluation.action !== "PASS";

      if (dqRequiresEdit && !issue.requiresEdit) {
        await IssueRepo.updateDraft(parsed.id, { requiresEdit: true, incrementVersion: false });
      }

      if (dq.evaluation.action === "BLOCK_PUBLISH" && !allowUnsafePublish()) {
        throw new Error(
          `Publishing blocked by quality gate (score=${dq.evaluation.qualityScore}). Resolve: ${dq.evaluation.flags.join(", ")}`
        );
      }

      if ((issue.requiresEdit || dqRequiresEdit) && !allowUnsafePublish()) {
        throw new Error("Issue flagged as requiresEdit; review and clean it before publishing");
      }

      const updated = await IssueRepo.publish(parsed.id);
      if (updated.version > issue.version) {
        await RevisionRepo.createRevision({
          issueId: parsed.id,
          fromVersion: issue.version,
          toVersion: updated.version,
          diffSummary: parsed.note?.trim() || "Published after review"
        });
      }
      await AuditService.record({
        action: "ISSUE_PUBLISH",
        entityType: "Issue",
        entityId: parsed.id,
        issueId: parsed.id,
        before,
        after: {
          status: updated.status,
          publishedAt: updated.publishedAt,
          qualityScore: dq.evaluation.qualityScore,
          qualityAction: dq.evaluation.action
        },
        note: parsed.note ?? `DQ:${dq.evaluation.action}:${dq.evaluation.qualityScore}`
      });
      IssueService.invalidateIssueCaches(updated.slug);

      try {
        await NotificationService.notifyFollowersOfIssue(updated.id);
      } catch (err) {
        logger.warn("editorial.publish_notify_failed", {
          issueId: updated.id,
          error: err instanceof Error ? err.message : String(err)
        });
      }
      return updated;
    }

    if (parsed.toStatus === "ARCHIVED") {
      const updated = await IssueRepo.archive(parsed.id);
      await AuditService.record({
        action: "ISSUE_ARCHIVE",
        entityType: "Issue",
        entityId: parsed.id,
        issueId: parsed.id,
        before,
        after: { status: updated.status },
        note: parsed.note ?? null
      });
      IssueService.invalidateIssueCaches(updated.slug);
      return updated;
    }

    logger.warn("editorial.transition_noop", { id: parsed.id, toStatus: parsed.toStatus });
    return issue;
  },

  async regenerateReactions(issueId: string) {
    const issue = await IssueRepo.getById(issueId);
    if (!issue) throw new Error("Issue not found");

    const generator = getGenerator();
    const tags = parseTags(issue.tags);

    const result = await generator.generateIssue({
      seedText: `${issue.title}. ${issue.contextSummary}`,
      tags,
      sensitivity: "SAFE"
    });

    const parsed = issueOutputSchema.parse(result.output);
    await IssueRepo.replaceReactions(issueId, parsed.reactions);

    // Optionally refresh base scores to keep the system coherent.
    const updated = await IssueRepo.updateDraft(issueId, {
      angerScore: parsed.angerScore,
      humorScore: parsed.humorScore,
      divisionScore: parsed.divisionScore,
      dominantEmotion: parsed.dominantEmotion,
      tags: parsed.tags
    });

    if (updated.version > issue.version) {
      await RevisionRepo.createRevision({
        issueId,
        fromVersion: issue.version,
        toVersion: updated.version,
        diffSummary: "Regenerated reactions and refreshed baseline scores"
      });
    }

    try {
      const dq = await QualityService.runAndStore(issueId, "ON_CREATE");
      if (dq.evaluation.action !== "PASS" && !updated.requiresEdit) {
        await IssueRepo.updateDraft(issueId, { requiresEdit: true, incrementVersion: false });
      }
    } catch (err) {
      logger.warn("editorial.regenerate_dq_failed", {
        issueId,
        error: err instanceof Error ? err.message : String(err)
      });
    }

    await AuditService.record({
      action: "ISSUE_REGENERATE_REACTIONS",
      entityType: "Issue",
      entityId: issueId,
      issueId,
      before: { reactionCount: issue.reactions.length },
      after: { reactionCount: parsed.reactions.length },
      note: "Reactions regenerated via generator"
    });

    IssueService.invalidateIssueCaches(issue.slug);
    return parsed.reactions.length;
  }
};

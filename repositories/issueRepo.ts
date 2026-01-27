import { type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type DominantEmotion = "ANGER" | "HUMOR" | "DIVISION" | "MIXED";
export type TimelinePhase = "TRIGGER" | "ESCALATION" | "PEAK" | "COOLING";
export type ReactionEmotionType = "ANGER" | "HUMOR" | "DIVISION" | "SUPPORT" | "NEUTRAL";

export interface IssueListQuery {
  status?: string;
  take?: number;
  skip?: number;
  tag?: string;
  orderBy?: Prisma.IssueOrderByWithRelationInput;
}

export const IssueRepo = {
  async list(query: IssueListQuery = {}) {
    const status = query.status ?? "PUBLISHED";

    // Tag filtering is intentionally deferred: SQLite + JSON arrays do not
    // support reliable contains queries. We'll move tags to a join table in
    // a later step without changing the repo interface.
    const where: Prisma.IssueWhereInput = {
      status
    };

    return prisma.issue.findMany({
      where,
      include: {
        timelineEvents: {
          orderBy: { order: "asc" }
        },
        reactions: true,
        qualityReports: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        shortsJobs: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        _count: {
          select: { votes: true }
        }
      },
      orderBy: query.orderBy ?? { publishedAt: "desc" },
      take: query.take ?? 20,
      skip: query.skip ?? 0
    });
  },

  async getBySlug(slug: string) {
    return prisma.issue.findUnique({
      where: { slug },
      include: {
        timelineEvents: {
          orderBy: { order: "asc" }
        },
        reactions: true,
        qualityReports: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        shortsJobs: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      }
    });
  },

  async getById(id: string) {
    return prisma.issue.findUnique({
      where: { id },
      include: {
        timelineEvents: {
          orderBy: { order: "asc" }
        },
        reactions: true,
        qualityReports: {
          orderBy: { createdAt: "desc" },
          take: 1
        },
        shortsJobs: {
          orderBy: { createdAt: "desc" },
          take: 3
        }
      }
    });
  },

  async createDraft(data: {
    slug: string;
    title: string;
    contextSummary: string;
    verdictLine: string;
    dominantEmotion: DominantEmotion;
    angerScore: number;
    humorScore: number;
    divisionScore: number;
    tags: string[];
    requiresEdit?: boolean;
    timelineEvents: Array<{
      phase: TimelinePhase;
      label: string;
      detail: string;
      order: number;
    }>;
    reactions: Array<{
      emotionType: ReactionEmotionType;
      text: string;
      intensity: number;
    }>;
  }) {
    return prisma.issue.create({
      data: {
        slug: data.slug,
        title: data.title,
        contextSummary: data.contextSummary,
        verdictLine: data.verdictLine,
        dominantEmotion: data.dominantEmotion,
        angerScore: data.angerScore,
        humorScore: data.humorScore,
        divisionScore: data.divisionScore,
        tags: data.tags.join(","),
        status: "DRAFT",
        requiresEdit: data.requiresEdit ?? false,
        timelineEvents: {
          create: data.timelineEvents
        },
        reactions: {
          create: data.reactions
        }
      },
      include: {
        timelineEvents: {
          orderBy: { order: "asc" }
        },
        reactions: true
      }
    });
  },

  async updateDraft(
    id: string,
    data: Partial<{
      title: string;
      contextSummary: string;
      verdictLine: string;
      dominantEmotion: DominantEmotion;
      angerScore: number;
      humorScore: number;
      divisionScore: number;
      tags: string[];
      requiresEdit: boolean;
      incrementVersion: boolean;
    }>
  ) {
    const incrementVersion = data.incrementVersion !== false;
    return prisma.issue.update({
      where: { id },
      data: {
        title: data.title,
        contextSummary: data.contextSummary,
        verdictLine: data.verdictLine,
        dominantEmotion: data.dominantEmotion,
        angerScore: data.angerScore,
        humorScore: data.humorScore,
        divisionScore: data.divisionScore,
        tags: data.tags ? data.tags.join(",") : undefined,
        requiresEdit: data.requiresEdit,
        version: incrementVersion ? { increment: 1 } : undefined
      }
    });
  },

  async replaceReactions(
    issueId: string,
    reactions: Array<{
      emotionType: ReactionEmotionType;
      text: string;
      intensity: number;
    }>
  ) {
    await prisma.reactionSample.deleteMany({ where: { issueId } });
    return prisma.reactionSample.createMany({
      data: reactions.map((reaction) => ({
        issueId,
        emotionType: reaction.emotionType,
        text: reaction.text,
        intensity: reaction.intensity
      }))
    });
  },

  async moveToReview(id: string) {
    return prisma.issue.update({
      where: { id },
      data: {
        status: "IN_REVIEW"
      }
    });
  },

  async publish(id: string) {
    return prisma.issue.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        version: { increment: 1 }
      }
    });
  },

  async archive(id: string) {
    return prisma.issue.update({
      where: { id },
      data: {
        status: "ARCHIVED"
      }
    });
  }
};

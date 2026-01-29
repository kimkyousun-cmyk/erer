import type { Prisma } from "@prisma/client";

export interface VoteUpsertInput {
  issueId: string;
  sessionHash: string;
  agree: boolean | null;
  justified: boolean | null;
}

export interface VoteAggregate {
  total: number;
  agree: number;
  disagree: number;
  justified: number;
  overreaction: number;
  matrix: {
    agreeJustified: number;
    agreeOverreaction: number;
    disagreeJustified: number;
    disagreeOverreaction: number;
  };
}

export function voteUpsertKey(issueId: string, sessionHash: string) {
  return `${issueId}:${sessionHash}`;
}

export const VoteRepo = {
  async upsertVote(input: VoteUpsertInput) {
    const { prisma } = await import("@/lib/db/prisma");
    const data: Prisma.VoteUncheckedCreateInput = {
      issueId: input.issueId,
      sessionHash: input.sessionHash,
      agree: input.agree,
      justified: input.justified
    };

    return prisma.vote.upsert({
      where: {
        issueId_sessionHash: {
          issueId: input.issueId,
          sessionHash: input.sessionHash
        }
      },
      update: {
        agree: input.agree,
        justified: input.justified,
        createdAt: new Date()
      },
      create: data
    });
  },

  async aggregateByIssue(issueId: string): Promise<VoteAggregate> {
    const { prisma } = await import("@/lib/db/prisma");
    const votes = await prisma.vote.findMany({
      where: { issueId },
      select: { agree: true, justified: true }
    });

    let agree = 0;
    let disagree = 0;
    let justified = 0;
    let overreaction = 0;
    let agreeJustified = 0;
    let agreeOverreaction = 0;
    let disagreeJustified = 0;
    let disagreeOverreaction = 0;

    for (const vote of votes) {
      if (vote.agree === true) agree += 1;
      if (vote.agree === false) disagree += 1;
      if (vote.justified === true) justified += 1;
      if (vote.justified === false) overreaction += 1;
      if (vote.agree === true && vote.justified === true) agreeJustified += 1;
      if (vote.agree === true && vote.justified === false) agreeOverreaction += 1;
      if (vote.agree === false && vote.justified === true) disagreeJustified += 1;
      if (vote.agree === false && vote.justified === false) disagreeOverreaction += 1;
    }

    return {
      total: votes.length,
      agree,
      disagree,
      justified,
      overreaction,
      matrix: {
        agreeJustified,
        agreeOverreaction,
        disagreeJustified,
        disagreeOverreaction
      }
    };
  }
};

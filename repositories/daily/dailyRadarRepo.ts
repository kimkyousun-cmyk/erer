import { prisma } from "@/lib/db/prisma";

export const DailyRadarRepo = {
  async getByDate(date: string) {
    return prisma.dailyRadar.findUnique({ where: { date } });
  },

  async upsert(input: {
    date: string;
    topIssueIds: string[];
    angerIndex: number;
    humorIndex: number;
    divisionIndex: number;
    summaryText: string;
  }) {
    const topIssueIds = input.topIssueIds.join(",");

    return prisma.dailyRadar.upsert({
      where: { date: input.date },
      update: {
        topIssueIds,
        angerIndex: input.angerIndex,
        humorIndex: input.humorIndex,
        divisionIndex: input.divisionIndex,
        summaryText: input.summaryText
      },
      create: {
        date: input.date,
        topIssueIds,
        angerIndex: input.angerIndex,
        humorIndex: input.humorIndex,
        divisionIndex: input.divisionIndex,
        summaryText: input.summaryText
      }
    });
  }
};

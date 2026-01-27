import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/repositories/userRepo";

export const FeatureUsageRepo = {
  async getTodayCount(userId: string, featureName: string) {
    const date = todayKey();
    const row = await prisma.featureUsageDaily.findUnique({
      where: {
        userId_featureName_date: {
          userId,
          featureName,
          date
        }
      }
    });
    return row?.count ?? 0;
  },

  async increment(userId: string, featureName: string) {
    const date = todayKey();
    const row = await prisma.featureUsageDaily.upsert({
      where: {
        userId_featureName_date: {
          userId,
          featureName,
          date
        }
      },
      update: {
        count: { increment: 1 }
      },
      create: {
        userId,
        featureName,
        date,
        count: 1
      }
    });
    return row.count;
  }
};

import { prisma } from "@/lib/db/prisma";

export type Plan = "FREE" | "PRO";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export const UserRepo = {
  async upsertUser(email: string) {
    return prisma.user.upsert({
      where: { email },
      update: {},
      create: { email }
    });
  },

  async getUserWithSubscription(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });
    if (!user) return null;

    const subscription = user.subscriptions[0] ?? null;
    return {
      user,
      subscription
    };
  },

  async ensureActiveSubscription(userId: string) {
    const existing = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" }
    });
    if (existing) return existing;

    return prisma.subscription.create({
      data: {
        userId,
        plan: "FREE",
        status: "ACTIVE",
        currentPeriodEnd: null
      }
    });
  },

  async setPlan(userId: string, plan: Plan) {
    await prisma.subscription.updateMany({
      where: { userId },
      data: { status: "CANCELED" }
    });

    return prisma.subscription.create({
      data: {
        userId,
        plan,
        status: "ACTIVE",
        currentPeriodEnd: null
      }
    });
  },

  async listUsers(take = 50) {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      plan: (user.subscriptions[0]?.plan ?? "FREE") as Plan
    }));
  }
};

export function todayKey() {
  return todayString();
}

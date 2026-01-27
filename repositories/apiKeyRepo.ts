import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { todayKey } from "@/repositories/userRepo";

function salt() {
  return process.env.API_KEYS_SALT ?? process.env.SESSION_SECRET ?? "dev-api-salt-change-me";
}

export function hashApiToken(token: string) {
  return createHmac("sha256", salt()).update(token).digest("hex");
}

function newToken() {
  return randomBytes(24).toString("base64url");
}

export const ApiKeyRepo = {
  async create(userId: string, name: string) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const token = newToken();
      const tokenHash = hashApiToken(token);

      try {
        const record = await prisma.apiKey.create({
          data: {
            userId,
            name: name.slice(0, 60),
            tokenHash
          }
        });

        return { record, token };
      } catch (err) {
        if (attempt === 3) throw err;
      }
    }

    throw new Error("Failed to create API key");
  },

  async revoke(id: string) {
    return prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  },

  async listForUser(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  },

  async verifyAndTrack(token: string) {
    const tokenHash = hashApiToken(token);
    const apiKey = await prisma.apiKey.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            subscriptions: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "desc" },
              take: 1
            }
          }
        }
      }
    });

    if (!apiKey || apiKey.revokedAt) return null;

    const date = todayKey();
    await prisma.apiUsageDaily.upsert({
      where: {
        apiKeyId_date: {
          apiKeyId: apiKey.id,
          date
        }
      },
      update: {
        count: { increment: 1 }
      },
      create: {
        apiKeyId: apiKey.id,
        date,
        count: 1
      }
    });

    return {
      apiKey,
      user: apiKey.user,
      subscriptionPlan: (apiKey.user.subscriptions[0]?.plan ?? "FREE") as "FREE" | "PRO"
    };
  }
};

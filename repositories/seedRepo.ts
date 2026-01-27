import { prisma } from "@/lib/db/prisma";

export interface SeedListQuery {
  status?: "PENDING" | "USED" | "REJECTED";
  take?: number;
  skip?: number;
}

export const SeedRepo = {
  async list(query: SeedListQuery = {}) {
    return prisma.seedItem.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { createdAt: "desc" },
      take: query.take ?? 50,
      skip: query.skip ?? 0
    });
  },

  async getById(id: string) {
    return prisma.seedItem.findUnique({ where: { id } });
  },

  async create(input: { text: string; sourceType: "MANUAL" | "USER_SUBMIT" | "RSS" }) {
    return prisma.seedItem.create({
      data: {
        text: input.text,
        sourceType: input.sourceType,
        status: "PENDING"
      }
    });
  },

  async reject(id: string, reason: string) {
    return prisma.seedItem.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectReason: reason
      }
    });
  },

  async markUsed(id: string) {
    return prisma.seedItem.update({
      where: { id },
      data: {
        status: "USED",
        usedAt: new Date()
      }
    });
  }
};

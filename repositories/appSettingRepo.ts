import { prisma } from "@/lib/db/prisma";

export const AppSettingRepo = {
  async get() {
    return prisma.appSetting.findFirst();
  },

  async ensure() {
    const existing = await prisma.appSetting.findFirst();
    if (existing) return existing;

    return prisma.appSetting.create({
      data: {
        n8nWebhookUrl: null,
        shortsWebhookSecret: process.env.SHORTS_WEBHOOK_SECRET ?? "dev-short-secret-change-me",
        siteName: "Emotion Radar",
        brandColor: "#7c5cff"
      }
    });
  }
};

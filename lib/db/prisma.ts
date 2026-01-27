import { PrismaClient } from "@prisma/client";
import { isDemoMode } from "@/lib/demo";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

type PrismaLike = PrismaClient;

let prismaSingleton: PrismaClient | null = global.__prisma__ ?? null;
let prismaInitError: Error | null = null;

function createClient(): PrismaClient | null {
  if (isDemoMode()) {
    return null;
  }

  if (prismaSingleton) {
    return prismaSingleton;
  }

  try {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });

    prismaSingleton = client;

    if (process.env.NODE_ENV !== "production") {
      global.__prisma__ = client;
    }

    return client;
  } catch (err) {
    prismaInitError = err instanceof Error ? err : new Error(String(err));
    return null;
  }
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = createClient();
      if (!client) {
        const message = isDemoMode()
          ? "Prisma is disabled in DEMO_MODE"
          : prismaInitError?.message ?? "Prisma client failed to initialize";
        throw new Error(message);
      }

      const value = (client as unknown as Record<string, unknown>)[prop as string];
      if (typeof value === "function") {
        return (value as Function).bind(client);
      }
      return value;
    }
  }
) as PrismaLike;

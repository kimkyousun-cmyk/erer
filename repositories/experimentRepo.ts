export interface VariantDef {
  name: string;
  weight: number;
}

function serializeVariants(variants: VariantDef[]) {
  return JSON.stringify(variants);
}

function parseVariants(json: string): VariantDef[] {
  try {
    const parsed = JSON.parse(json) as VariantDef[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => ({ name: String(v.name), weight: Number(v.weight) }))
      .filter((v) => v.name.length > 0 && Number.isFinite(v.weight) && v.weight > 0);
  } catch {
    return [];
  }
}

export const ExperimentRepo = {
  async listExperiments() {
    const { prisma } = await import("@/lib/db/prisma");
    const experiments = await prisma.experiment.findMany({
      orderBy: [{ updatedAt: "desc" }]
    });
    return experiments.map((exp) => ({
      ...exp,
      variants: parseVariants(exp.variantsJson)
    }));
  },

  async getByKey(key: string) {
    const { prisma } = await import("@/lib/db/prisma");
    const exp = await prisma.experiment.findUnique({ where: { key } });
    if (!exp) return null;
    return {
      ...exp,
      variants: parseVariants(exp.variantsJson)
    };
  },

  async upsertExperiment(input: {
    key: string;
    status: "DRAFT" | "RUNNING" | "PAUSED" | "ENDED";
    variants: VariantDef[];
    targetingJson?: string | null;
  }) {
    const { prisma } = await import("@/lib/db/prisma");
    const variantsJson = serializeVariants(input.variants);
    const exp = await prisma.experiment.upsert({
      where: { key: input.key },
      update: {
        status: input.status,
        variantsJson,
        targetingJson: input.targetingJson ?? null
      },
      create: {
        key: input.key,
        status: input.status,
        variantsJson,
        targetingJson: input.targetingJson ?? null
      }
    });
    return { ...exp, variants: parseVariants(exp.variantsJson) };
  },

  async getAssignment(experimentId: string, sessionHash: string) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.assignment.findUnique({
      where: {
        experimentId_sessionHash: {
          experimentId,
          sessionHash
        }
      }
    });
  },

  async createAssignment(input: { experimentId: string; sessionHash: string; variantName: string; userId?: string | null }) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.assignment.create({
      data: {
        experimentId: input.experimentId,
        sessionHash: input.sessionHash,
        variantName: input.variantName,
        userId: input.userId ?? null
      }
    });
  },

  async upsertAssignment(input: { experimentId: string; sessionHash: string; variantName: string; userId?: string | null }) {
    const { prisma } = await import("@/lib/db/prisma");
    return prisma.assignment.upsert({
      where: {
        experimentId_sessionHash: {
          experimentId: input.experimentId,
          sessionHash: input.sessionHash
        }
      },
      update: {
        variantName: input.variantName,
        userId: input.userId ?? null
      },
      create: {
        experimentId: input.experimentId,
        sessionHash: input.sessionHash,
        variantName: input.variantName,
        userId: input.userId ?? null
      }
    });
  }
};

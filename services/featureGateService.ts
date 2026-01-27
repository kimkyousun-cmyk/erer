import { hasFeature, featureDailyLimit, type FeatureName } from "@/lib/featureGates";
import { logger } from "@/lib/log";
import { getUserSession } from "@/lib/auth/userSession";
import { FeatureUsageRepo } from "@/repositories/featureUsageRepo";

export interface FeatureGateResult {
  ok: boolean;
  plan: "FREE" | "PRO" | "ANON";
  reason?: string;
  remaining?: number | null;
  userId?: string;
}

export async function requireFeature(
  feature: FeatureName,
  options: { incrementUsage?: boolean } = {}
): Promise<FeatureGateResult> {
  const session = await getUserSession();
  if (!session) {
    return {
      ok: false,
      plan: "ANON",
      reason: "Login required"
    };
  }

  const plan = session.plan;
  if (!hasFeature(plan, feature)) {
    return {
      ok: false,
      plan,
      reason: "Upgrade required"
    };
  }

  const limit = featureDailyLimit(plan, feature);
  if (!limit) {
    return { ok: true, plan, remaining: null, userId: session.user.id };
  }

  try {
    const current = await FeatureUsageRepo.getTodayCount(session.user.id, feature);
    const remaining = Math.max(0, limit - current);
    if (remaining <= 0) {
      return {
        ok: false,
        plan,
        reason: "Daily limit reached",
        remaining: 0,
        userId: session.user.id
      };
    }

    if (options.incrementUsage) {
      const next = await FeatureUsageRepo.increment(session.user.id, feature);
      return {
        ok: true,
        plan,
        remaining: Math.max(0, limit - next),
        userId: session.user.id
      };
    }

    return {
      ok: true,
      plan,
      remaining,
      userId: session.user.id
    };
  } catch (err) {
    logger.warn("feature_gate.failed", {
      feature,
      error: err instanceof Error ? err.message : String(err)
    });
    return {
      ok: false,
      plan,
      reason: "Feature gate unavailable"
    };
  }
}

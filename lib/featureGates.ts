export type FeatureName =
  | "EXPORT_SHORTS_PACKAGE"
  | "EXPORT_BULK"
  | "VIEW_HISTORY_30D"
  | "VIEW_HISTORY_365D"
  | "API_ACCESS"
  | "WEEKLY_REPORT";

export type PlanName = "FREE" | "PRO";

const planFeatures: Record<PlanName, Set<FeatureName>> = {
  FREE: new Set(["EXPORT_SHORTS_PACKAGE"]),
  PRO: new Set([
    "EXPORT_SHORTS_PACKAGE",
    "EXPORT_BULK",
    "VIEW_HISTORY_30D",
    "VIEW_HISTORY_365D",
    "API_ACCESS",
    "WEEKLY_REPORT"
  ])
};

const planLimits: Record<PlanName, Partial<Record<FeatureName, number>>> = {
  FREE: {
    EXPORT_SHORTS_PACKAGE: 3
  },
  PRO: {}
};

export function hasFeature(plan: PlanName, feature: FeatureName) {
  return planFeatures[plan]?.has(feature) ?? false;
}

export function featureDailyLimit(plan: PlanName, feature: FeatureName) {
  return planLimits[plan]?.[feature] ?? null;
}

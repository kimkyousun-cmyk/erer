import { logger } from "@/lib/log";
import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { ApiKeyRepo } from "@/repositories/apiKeyRepo";

function readBearer(headers: Headers) {
  const auth = headers.get("authorization");
  if (!auth) return null;
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

function readApiKey(headers: Headers) {
  return headers.get("x-api-key")?.trim() ?? null;
}

export interface PublicApiAuthContext {
  tier: "ANON" | "PRO";
  plan: "FREE" | "PRO" | null;
  apiKeyId: string | null;
  userId: string | null;
  rateLimited: boolean;
  retryAfterSeconds?: number;
}

export async function authorizePublicApi(headers: Headers): Promise<PublicApiAuthContext> {
  const ip = getRequestIp(headers);
  const token = readBearer(headers) ?? readApiKey(headers);

  if (!token) {
    const limit = tokenBucket(`public:anon:${ip}`, rateLimitConfigs.publicApi);
    return {
      tier: "ANON",
      plan: null,
      apiKeyId: null,
      userId: null,
      rateLimited: !limit.allowed,
      retryAfterSeconds: limit.retryAfterSeconds
    };
  }

  const verified = await ApiKeyRepo.verifyAndTrack(token);
  if (!verified) {
    const limit = tokenBucket(`public:badkey:${ip}`, rateLimitConfigs.publicApi);
    return {
      tier: "ANON",
      plan: null,
      apiKeyId: null,
      userId: null,
      rateLimited: !limit.allowed,
      retryAfterSeconds: limit.retryAfterSeconds
    };
  }

  if (verified.subscriptionPlan !== "PRO") {
    logger.warn("public_api.non_pro_key", { apiKeyId: verified.apiKey.id });
    return {
      tier: "ANON",
      plan: verified.subscriptionPlan,
      apiKeyId: verified.apiKey.id,
      userId: verified.user.id,
      rateLimited: true,
      retryAfterSeconds: 60
    };
  }

  const limit = tokenBucket(`public:pro:${verified.apiKey.id}`, rateLimitConfigs.apiKeyPublic);
  return {
    tier: "PRO",
    plan: verified.subscriptionPlan,
    apiKeyId: verified.apiKey.id,
    userId: verified.user.id,
    rateLimited: !limit.allowed,
    retryAfterSeconds: limit.retryAfterSeconds
  };
}

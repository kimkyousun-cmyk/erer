interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface TokenBucketConfig {
  capacity: number;
  refillRatePerSec: number;
}

interface BucketState {
  tokens: number;
  lastRefillAt: number;
}

const buckets = new Map<string, BucketState>();

function refill(state: BucketState, config: TokenBucketConfig, now: number) {
  const elapsed = Math.max(0, now - state.lastRefillAt) / 1000;
  const refillAmount = elapsed * config.refillRatePerSec;
  state.tokens = Math.min(config.capacity, state.tokens + refillAmount);
  state.lastRefillAt = now;
}

export function tokenBucket(key: string, config: TokenBucketConfig): RateLimitDecision {
  const now = Date.now();
  const existing = buckets.get(key);

  const state: BucketState =
    existing ?? {
      tokens: config.capacity,
      lastRefillAt: now
    };

  refill(state, config, now);

  if (state.tokens >= 1) {
    state.tokens -= 1;
    buckets.set(key, state);
    return {
      allowed: true,
      remaining: Math.floor(state.tokens),
      retryAfterSeconds: 0
    };
  }

  buckets.set(key, state);

  const secondsUntilNextToken = Math.ceil(1 / Math.max(config.refillRatePerSec, 0.0001));
  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: secondsUntilNextToken
  };
}

// Named configs keep intent obvious at call sites.
export const rateLimitConfigs = {
  publicSeedSubmit: {
    capacity: 3,
    refillRatePerSec: 3 / 3600
  },
  voteSubmit: {
    capacity: 20,
    refillRatePerSec: 20 / 60
  },
  shortsExport: {
    capacity: 12,
    refillRatePerSec: 12 / 60
  },
  webhookIngest: {
    capacity: 120,
    refillRatePerSec: 120 / 60
  },
  apiKeyPublic: {
    capacity: 120,
    refillRatePerSec: 120 / 60
  },
  publicApi: {
    capacity: 60,
    refillRatePerSec: 60 / 60
  },
  eventIngest: {
    capacity: 180,
    refillRatePerSec: 180 / 60
  },
  feedbackSubmit: {
    capacity: 20,
    refillRatePerSec: 20 / 60
  },
  followAction: {
    capacity: 40,
    refillRatePerSec: 40 / 60
  },
  adminSeedActions: {
    capacity: 30,
    refillRatePerSec: 30 / 60
  }
} satisfies Record<string, TokenBucketConfig>;

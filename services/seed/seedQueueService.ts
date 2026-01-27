import { tokenBucket, rateLimitConfigs } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/request";
import { sanitizeSeedText } from "@/lib/safety/seedSafety";
import {
  adminCreateSeedSchema,
  publicSubmitSeedSchema,
  type AdminCreateSeedInput,
  type PublicSubmitSeedInput
} from "@/lib/validation/seed";
import { SeedRepo } from "@/repositories/seedRepo";

export interface SeedSubmitResult {
  ok: boolean;
  message: string;
  seedId?: string;
  status?: "PENDING" | "REJECTED";
  rejectReason?: string;
  retryAfterSeconds?: number;
}

function validateAdminInput(input: AdminCreateSeedInput) {
  return adminCreateSeedSchema.safeParse(input);
}

function validatePublicInput(input: PublicSubmitSeedInput) {
  return publicSubmitSeedSchema.safeParse(input);
}

export const SeedQueueService = {
  async list(status?: "PENDING" | "USED" | "REJECTED") {
    return SeedRepo.list({ status, take: 100 });
  },

  async createFromAdmin(input: AdminCreateSeedInput): Promise<SeedSubmitResult> {
    const parsed = validateAdminInput(input);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return { ok: false, message: msg };
    }

    const safety = sanitizeSeedText(parsed.data.text);
    if (!safety.sanitizedText) {
      return { ok: false, message: "Seed is empty after sanitization" };
    }

    if (!safety.isSafe) {
      const rejected = await SeedRepo.create({
        text: safety.sanitizedText,
        sourceType: parsed.data.sourceType
      });
      await SeedRepo.reject(rejected.id, safety.rejectReason ?? "Unsafe seed text");

      return {
        ok: false,
        message: "Seed rejected by safety filter",
        seedId: rejected.id,
        status: "REJECTED",
        rejectReason: safety.rejectReason ?? "Unsafe seed text"
      };
    }

    const created = await SeedRepo.create({
      text: safety.sanitizedText,
      sourceType: parsed.data.sourceType
    });

    return {
      ok: true,
      message: "Seed added to queue",
      seedId: created.id,
      status: "PENDING"
    };
  },

  async submitFromPublic(
    input: PublicSubmitSeedInput,
    requestHeaders: Headers
  ): Promise<SeedSubmitResult> {
    const ip = getRequestIp(requestHeaders);
    const decision = tokenBucket(`seed:submit:${ip}`, rateLimitConfigs.publicSeedSubmit);

    if (!decision.allowed) {
      return {
        ok: false,
        message: "Too many submissions. Please try later.",
        retryAfterSeconds: decision.retryAfterSeconds
      };
    }

    const parsed = validatePublicInput(input);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input";
      return { ok: false, message: msg };
    }

    const safety = sanitizeSeedText(parsed.data.text);
    if (!safety.sanitizedText) {
      return { ok: false, message: "Seed is empty after sanitization" };
    }

    const created = await SeedRepo.create({
      text: safety.sanitizedText,
      sourceType: "USER_SUBMIT"
    });

    if (!safety.isSafe) {
      await SeedRepo.reject(created.id, safety.rejectReason ?? "Unsafe seed text");
      return {
        ok: false,
        message: "Submission received but flagged for review",
        seedId: created.id,
        status: "REJECTED",
        rejectReason: safety.rejectReason ?? "Unsafe seed text"
      };
    }

    return {
      ok: true,
      message: "Thanks — your topic suggestion is queued",
      seedId: created.id,
      status: "PENDING"
    };
  },

  async reject(id: string, reason: string) {
    const decision = tokenBucket(`seed:admin:reject:${id}`, rateLimitConfigs.adminSeedActions);
    if (!decision.allowed) {
      return {
        ok: false,
        message: "Rate limited",
        retryAfterSeconds: decision.retryAfterSeconds
      } satisfies SeedSubmitResult;
    }

    await SeedRepo.reject(id, reason);
    return {
      ok: true,
      message: "Seed rejected",
      seedId: id,
      status: "REJECTED"
    } satisfies SeedSubmitResult;
  }
};

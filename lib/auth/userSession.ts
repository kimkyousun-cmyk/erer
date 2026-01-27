import { cookies } from "next/headers";
import { logger } from "@/lib/log";
import { UserRepo, type Plan } from "@/repositories/userRepo";

const USER_COOKIE = "user_email";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function setUserSession(email: string) {
  const normalized = normalizeEmail(email);
  const jar = cookies();
  jar.set(USER_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  try {
    const user = await UserRepo.upsertUser(normalized);
    await UserRepo.ensureActiveSubscription(user.id);
    return user;
  } catch (err) {
    logger.warn("user_session.set_failed", {
      email: normalized,
      error: err instanceof Error ? err.message : String(err)
    });
    return null;
  }
}

export function clearUserSession() {
  const jar = cookies();
  jar.set(USER_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getUserSession() {
  const email = cookies().get(USER_COOKIE)?.value;
  if (!email) return null;

  try {
    const data = await UserRepo.getUserWithSubscription(email);
    if (!data) return null;

    const subscription = data.subscription ?? (await UserRepo.ensureActiveSubscription(data.user.id));
    const plan = (subscription.plan ?? "FREE") as Plan;

    return {
      user: data.user,
      subscription,
      plan
    };
  } catch (err) {
    logger.warn("user_session.get_failed", {
      email,
      error: err instanceof Error ? err.message : String(err)
    });
    return {
      user: { id: "dev", email, createdAt: new Date() },
      subscription: { id: "dev", userId: "dev", plan: "FREE", status: "ACTIVE", createdAt: new Date(), updatedAt: new Date(), currentPeriodEnd: null },
      plan: "FREE" as Plan
    };
  }
}

export function getSessionEmail() {
  return cookies().get(USER_COOKIE)?.value ?? null;
}

import { getUserSession } from "@/lib/auth/userSession";
import { isDemoMode } from "@/lib/demo";
import { NotificationRepo } from "@/repositories/notificationRepo";
import { logger } from "@/lib/log";

export async function getCurrentUserNotifications(take = 40) {
  const session = await getUserSession();
  if (!session) return null;

  if (isDemoMode()) {
    return {
      userId: session.user.id,
      items: [],
      unreadCount: 0,
      mode: "demo" as const
    };
  }

  try {
    const [items, unreadCount] = await Promise.all([
      NotificationRepo.listForUser(session.user.id, take),
      NotificationRepo.countUnread(session.user.id)
    ]);
    return {
      userId: session.user.id,
      items,
      unreadCount
    };
  } catch (err) {
    logger.error("notifications.query_failed", err, { userId: session.user.id });
    return {
      userId: session.user.id,
      items: [] as Awaited<ReturnType<typeof NotificationRepo.listForUser>>,
      unreadCount: 0
    };
  }
}

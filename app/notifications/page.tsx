import type { Metadata } from "next";
import Link from "next/link";
import { NotificationList } from "@/components/NotificationList";
import { getCurrentUserNotifications } from "@/services/notifications/notificationQueryService";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false }
};

export default async function NotificationsPage() {
  const data = await getCurrentUserNotifications(60);

  if (!data) {
    return (
      <main className="space-y-6">
        <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h1 className="text-3xl font-semibold text-ink">Notifications</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Login to receive alerts when tags you follow light up.</p>
          <div className="mt-3">
            <Link
              href="/login"
              className="rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 transition hover:border-violet-200/60"
            >
              Login
            </Link>
          </div>
        </header>
      </main>
    );
  }

  const items = data.items.map((item) => ({
    id: item.id,
    type: item.type,
    payload: item.payload,
    readAt: item.readAt ? item.readAt.toISOString() : null,
    createdAt: item.createdAt.toISOString()
  }));

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h1 className="text-3xl font-semibold text-ink">Notifications</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Signals that match your followed tags show up here.</p>
      </header>

      <NotificationList items={items} />
    </main>
  );
}

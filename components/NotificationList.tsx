"use client";

import { useCallback, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

interface NotificationListProps {
  items: NotificationItem[];
}

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

function renderBody(item: NotificationItem) {
  if (item.type === "NEW_ISSUE_IN_TAG") {
    const slug = typeof item.payload?.slug === "string" ? item.payload.slug : null;
    const title = typeof item.payload?.title === "string" ? item.payload.title : "New issue";
    return {
      title,
      href: slug ? `/issue/${slug}` : null,
      detail: "A topic you follow has a new mood summary."
    };
  }

  return {
    title: item.type,
    href: null,
    detail: "Notification"
  };
}

export function NotificationList({ items }: NotificationListProps) {
  const [state, setState] = useState(items);

  const unreadCount = useMemo(() => state.filter((n) => !n.readAt).length, [state]);

  const markRead = useCallback(async (id: string) => {
    setState((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch {
      // Swallow errors; state is already optimistic.
    }
  }, []);

  return (
    <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Notifications</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
          {unreadCount} unread
        </div>
      </div>

      {state.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">No notifications yet.</div>
      ) : (
        <ul className="space-y-2">
          {state.map((item) => {
            const body = renderBody(item);
            const unread = !item.readAt;
            return (
              <li
                key={item.id}
                className={`rounded-2xl border p-4 ${unread ? "border-violet-300/40 bg-violet-500/10" : "border-white/5 bg-white/5"}`}
              >
                <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <span>{item.type}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="mb-1 text-sm font-semibold text-ink">{body.title}</div>
                <p className="mb-2 text-sm leading-6 text-muted">{body.detail}</p>
                <div className="flex flex-wrap gap-2">
                  {body.href ? (
                    <a
                      href={body.href}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
                    >
                      Open
                    </a>
                  ) : null}
                  {unread ? (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

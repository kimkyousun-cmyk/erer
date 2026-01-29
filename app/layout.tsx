import type { Metadata } from "next";
import "@/app/globals.css";
import Link from "next/link";
import { getUserSession } from "@/lib/auth/userSession";
import { NotificationRepo } from "@/repositories/notificationRepo";
import { isDemoMode } from "@/lib/demo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1ba5bb33.menu-piker.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Emotion Radar — Feel the Internet",
    template: "%s · Emotion Radar"
  },
  description:
    "Emotion Radar visualizes how the internet feels about trending issues — fast, opinionated, and built for signal.",
  openGraph: {
    title: "Emotion Radar — Feel the Internet",
    description:
      "See trending issues summarized emotionally: anger, humor, and division at a glance.",
    url: siteUrl,
    siteName: "Emotion Radar",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Emotion Radar — Feel the Internet",
    description:
      "A public sentiment visualization engine for internet issues. Emotion over information."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const sessionPromise = getUserSession();

  return (
    <html lang="en" className="dark">
      <body>
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {/* Top bar stays server-rendered and cheap. */}
          {/* eslint-disable-next-line react/no-unstable-nested-components */}
          <TopBar sessionPromise={sessionPromise} />
          <div className="mt-6">{children}</div>
        </div>
      </body>
    </html>
  );
}

async function TopBar({ sessionPromise }: { sessionPromise: ReturnType<typeof getUserSession> }) {
  const session = await sessionPromise;
  const demoMode = isDemoMode();
  let unreadCount = 0;
  if (session && !demoMode) {
    try {
      unreadCount = await NotificationRepo.countUnread(session.user.id);
    } catch {
      unreadCount = 0;
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/5 bg-panel/60 px-4 py-3 text-xs text-muted shadow-glow">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-semibold uppercase tracking-[0.12em] text-ink">
          Emotion Radar
        </Link>
        {demoMode ? (
          <span className="rounded-2xl border border-amber-300/50 bg-amber-400/15 px-2.5 py-1 font-semibold uppercase tracking-wide text-amber-100">
            Demo Mode
          </span>
        ) : null}
        <Link
          href="/daily"
          className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide transition hover:border-white/20"
        >
          Daily
        </Link>
        <Link
          href="/collections"
          className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide transition hover:border-white/20"
        >
          Collections
        </Link>
      </div>

      {session ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide text-ink">
            {session.plan}
          </div>
          <Link
            href="/account/api-keys"
            className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide transition hover:border-white/20"
          >
            API Keys
          </Link>
          <Link
            href="/notifications"
            className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide transition hover:border-white/20"
          >
            Alerts{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Link>
          <div className="hidden sm:block">{session.user.email}</div>
          <Link
            href="/logout"
            className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide transition hover:border-white/20"
          >
            Logout
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-2xl border border-violet-300/40 bg-violet-500/20 px-3 py-1.5 font-semibold uppercase tracking-wide text-violet-100 transition hover:border-violet-200/60"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { listFeedbackSummary, listRecentFeedback } from "@/services/feedback/adminFeedbackService";

export const metadata: Metadata = {
  title: "Feedback Queue",
  robots: { index: false, follow: false }
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AdminFeedbackPage() {
  const [summary, recent] = await Promise.all([listFeedbackSummary(24), listRecentFeedback(80)]);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Feedback Loop</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          User signals flow here. Use this queue to decide what to revise, regenerate, or archive.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/issues"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Editorial Issues
          </Link>
          <Link
            href="/admin/issue-intake"
            className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-200/60"
          >
            New Draft
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Issues With Feedback</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {summary.length}
          </div>
        </div>
        {summary.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">
            No feedback yet. Once users react, the issues will appear here.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {summary.map((row) => (
              <li key={row.issueId} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>{row.issue?.status ?? "UNKNOWN"}</span>
                  <span>{row.count} signals</span>
                </div>
                <div className="mb-2 text-base font-semibold text-ink">{row.issue?.title ?? row.issueId}</div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/issues/${row.issueId}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
                  >
                    Open Editor
                  </Link>
                  {row.issue?.slug ? (
                    <Link
                      href={`/issue/${row.issue.slug}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
                    >
                      View Public
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent Feedback</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {recent.length}
          </div>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">
            No signals yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((item) => (
              <li key={item.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{item.type}</span>
                    {item.note ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted">note</span>
                    ) : null}
                  </div>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="mb-1 text-sm font-semibold text-ink">{item.issue.title}</div>
                {item.note ? <p className="mb-2 text-sm leading-6 text-muted">{item.note}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/issues/${item.issueId}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
                  >
                    Revise
                  </Link>
                  <Link
                    href={`/issue/${item.issue.slug}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
                  >
                    View Public
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireFeature } from "@/services/featureGateService";
import { defaultWeekKey, generateWeeklyReport } from "@/services/reports/weeklyReportService";
import { IssueCard } from "@/components/IssueCard";

export const metadata: Metadata = {
  title: "Weekly Report",
  robots: { index: false, follow: false }
};

interface WeeklyPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function WeeklyReportPage({ searchParams }: WeeklyPageProps) {
  const gate = await requireFeature("WEEKLY_REPORT");

  if (!gate.ok) {
    return (
      <main className="mx-auto max-w-2xl space-y-6">
        <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h1 className="text-3xl font-semibold text-ink">Weekly Report</h1>
          <p className="mt-2 text-sm text-muted">Weekly reports are a PRO feature.</p>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/60"
            >
              Upgrade (Admin)
            </Link>
          </div>
        </header>
      </main>
    );
  }

  const week = readParam(searchParams?.week) ?? defaultWeekKey();
  const report = await generateWeeklyReport(week);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">PRO</p>
        <h1 className="text-3xl font-semibold text-ink sm:text-5xl">Weekly Mood Report</h1>
        <p className="mt-2 text-sm text-muted">
          Week {report.weekStart} → {report.weekEnd}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-200/80">Anger</div>
            <div className="text-3xl font-semibold text-red-100">{report.mood.angerIndex}</div>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-100/80">Humor</div>
            <div className="text-3xl font-semibold text-amber-100">{report.mood.humorIndex}</div>
          </div>
          <div className="rounded-2xl border border-violet-300/30 bg-violet-500/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-100/80">Division</div>
            <div className="text-3xl font-semibold text-violet-100">{report.mood.divisionIndex}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            Most Divided: {report.highlights.mostDivided ?? "—"}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            Funniest: {report.highlights.mostHumorous ?? "—"}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            Angriest: {report.highlights.mostAngry ?? "—"}
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={`/api/reports/weekly?week=${encodeURIComponent(week)}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
          >
            Download JSON
          </Link>
        </div>
      </header>

      <section className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">Top Issues This Week</h2>
            <p className="text-sm text-muted">The issues that most shaped the weekly mood.</p>
          </div>
        </div>

        {report.topIssues.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-panel/70 p-6 text-sm text-muted shadow-glow">
            No published issues in this week yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {report.topIssues.map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { IssueCard } from "@/components/IssueCard";
import { getDailyRadarView } from "@/services/daily/dailyRadarService";

export const metadata: Metadata = {
  title: "Daily Radar",
  description: "A daily snapshot of internet mood: anger, humor, and division in one glance.",
  openGraph: {
    title: "Daily Radar · Emotion Radar",
    description: "See today's mood indices and the top issues driving the vibe.",
    type: "website"
  }
};

function deltaLabel(delta: number) {
  if (delta > 0) return `▲ +${delta}`;
  if (delta < 0) return `▼ ${delta}`;
  return "• 0";
}

export default async function DailyRadarPage() {
  const view = await getDailyRadarView();

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Daily Mood</p>
        <h1 className="text-3xl font-semibold text-ink sm:text-5xl">Daily Radar</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          {view.summaryText}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-200/80">Anger</div>
            <div className="text-3xl font-semibold text-red-100">{view.indices.angerIndex}</div>
            <div className="text-xs font-semibold text-red-200/80">{deltaLabel(view.deltas.anger)}</div>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-100/80">Humor</div>
            <div className="text-3xl font-semibold text-amber-100">{view.indices.humorIndex}</div>
            <div className="text-xs font-semibold text-amber-100/80">{deltaLabel(view.deltas.humor)}</div>
          </div>
          <div className="rounded-2xl border border-violet-300/30 bg-violet-500/10 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-100/80">Division</div>
            <div className="text-3xl font-semibold text-violet-100">{view.indices.divisionIndex}</div>
            <div className="text-xs font-semibold text-violet-100/80">{deltaLabel(view.deltas.division)}</div>
          </div>
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Date: {view.date}</div>
      </header>

      <section className="space-y-2">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">Top Issues Today</h2>
            <p className="text-sm text-muted">The issues most responsible for the mood index.</p>
          </div>
        </div>

        {view.topIssues.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-panel/70 p-6 text-sm text-muted shadow-glow">
            No published issues yet. Use the intake flow to create drafts and publish them.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {view.topIssues.map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

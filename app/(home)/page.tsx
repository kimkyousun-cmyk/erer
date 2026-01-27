import type { Metadata } from "next";
import { IssueCard } from "@/components/IssueCard";
import { IssueService } from "@/services/issues/issueService";
import { FeedService } from "@/services/feed/feedService";
import { ExperimentService } from "@/services/experiments/experimentService";

export const metadata: Metadata = {
  title: "Emotion Radar — Trending Mood",
  description:
    "Trending internet issues summarized emotionally: anger, humor, and division in one glance."
};

export default async function HomePage() {
  const [issues, layoutVariant] = await Promise.all([
    (async () => {
      try {
        const params = new URLSearchParams({ mode: "trending", take: "24", skip: "0" });
        const feed = await FeedService.getFeed(params);
        return feed.issues;
      } catch {
        return IssueService.listIssues({ status: "PUBLISHED", take: 24 });
      }
    })(),
    ExperimentService.getVariant("HOME_LAYOUT_DENSITY")
  ]);

  const compact = layoutVariant.active && layoutVariant.variant !== "control";
  const gridGap = compact ? "gap-3" : "gap-4";

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Emotion &gt; Information
            </p>
            <h1 className="mb-4 text-3xl font-semibold leading-[1.05] text-ink sm:text-5xl">
              Feel the Internet
              <span className="block text-muted">before it explains itself.</span>
            </h1>
            <p className="text-base leading-7 text-muted">
              Emotion Radar is a public sentiment visualization engine. It does not tell you the facts.
              It shows the mood: who is mad, who is laughing, and where the split lives.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/5 p-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-red-100">
              Anger
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-amber-100">
              Humor
            </div>
            <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-violet-100">
              Division
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink sm:text-2xl">Trending Issues</h2>
            <p className="text-sm text-muted">Signal-first cards you can scan and share.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Live Mood
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${gridGap}`}>
          {issues.map((issue) => (
            <IssueCard key={issue.slug} issue={issue} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Speed</div>
          <h3 className="mb-2 text-lg font-semibold text-ink">Mood in Seconds</h3>
          <p className="text-sm leading-6 text-muted">
            We optimize for the first 10 seconds: emotional clarity beats exhaustive coverage.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Signal</div>
          <h3 className="mb-2 text-lg font-semibold text-ink">Opinionated by Design</h3>
          <p className="text-sm leading-6 text-muted">
            Ambiguity is allowed if it feels truthful. We highlight the energy, not the receipts.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Share</div>
          <h3 className="mb-2 text-lg font-semibold text-ink">Cards That Travel</h3>
          <p className="text-sm leading-6 text-muted">
            Each card is built to screenshot cleanly on mobile and hold up out of context.
          </p>
        </div>
      </section>
    </main>
  );
}

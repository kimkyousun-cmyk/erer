"use client";

import { useMemo, useState } from "react";
import type { EmotionKey, EmotionScores, IssueDetail } from "@/lib/types";
import { EmotionBar } from "@/components/EmotionBar";
import { VerdictBadge } from "@/components/VerdictBadge";
import { VotePanel } from "@/components/VotePanel";
import { CreatorToolsPanel } from "@/components/CreatorToolsPanel";
import { useTrackIssueOpen, useTrackScrollDepth } from "@/hooks/useTrackEvent";
import { FeedbackPanel } from "@/components/FeedbackPanel";

interface IssueDetailClientProps {
  issue: IssueDetail;
}

function emotionSummary(scores: EmotionScores) {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = sorted[0] as [EmotionKey, number];
  const second = sorted[1][1];

  if (topKey === "anger") {
    return topScore - second > 12
      ? "The mood is protective and sharp — people feel a boundary was crossed."
      : "Anger leads, but it is tangled with debate and dunking.";
  }
  if (topKey === "humor") {
    return topScore > 70
      ? "This is being processed as entertainment first, outrage second."
      : "People are laughing, but the jokes carry real side-eyes.";
  }
  return topScore > 75
    ? "This is a live wire — everyone has a take and none of them line up."
    : "Division is the headline: people are arguing from identity, not details.";
}

const reactionTone: Record<EmotionKey, string> = {
  anger: "border-red-400/30 bg-red-500/10 text-red-100",
  humor: "border-amber-300/40 bg-amber-400/10 text-amber-100",
  division: "border-violet-400/30 bg-violet-500/10 text-violet-100"
};

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
  const [scores, setScores] = useState(issue.scores);
  const summary = useMemo(() => emotionSummary(scores), [scores]);
  useTrackIssueOpen(issue.id, issue.tags);
  useTrackScrollDepth(issue.id, issue.tags);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">Emotional Overview</h2>
            <VerdictBadge label={issue.verdict.label} tone={issue.verdict.tone} />
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-6 text-muted">{summary}</p>

          <div className="grid grid-cols-1 gap-4">
            <EmotionBar label="Anger" value={scores.anger} tone="anger" size="lg" />
            <EmotionBar label="Humor" value={scores.humor} tone="humor" size="lg" />
            <EmotionBar label="Division" value={scores.division} tone="division" size="lg" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h3 className="mb-4 text-lg font-semibold text-ink">Timeline</h3>
          <ol className="space-y-4">
            {issue.timeline.map((phase) => (
              <li key={phase.key} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>{phase.label}</span>
                  <span>Intensity {phase.intensity}</span>
                </div>
                <p className="text-sm leading-6 text-ink">{phase.summary}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">Reaction Simulation</h3>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Synthetic</div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {issue.reactions.map((reaction) => (
              <article
                key={reaction.id}
                className={`rounded-2xl border p-4 text-sm leading-6 ${reactionTone[reaction.emotion]}`}
              >
                {reaction.text}
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h3 className="mb-3 text-lg font-semibold text-ink">Why This Blew Up</h3>
          <ul className="grid grid-cols-1 gap-2 text-sm leading-6 text-ink">
            {issue.whyItBlewUp.map((line) => (
              <li key={line} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h3 className="mb-3 text-lg font-semibold text-ink">Why People Disagree</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm leading-6 text-ink">
              {issue.whyPeopleDisagree.sideA}
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm leading-6 text-ink">
              {issue.whyPeopleDisagree.sideB}
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-6">
        <VotePanel
          slug={issue.slug}
          issueId={issue.id}
          tags={issue.tags}
          initialPulse={issue.communityPulse}
          onAdjustedScores={setScores}
        />

        <CreatorToolsPanel
          issueId={issue.id}
          slug={issue.slug}
          tags={issue.tags}
          shortsStatus={issue.shorts ?? null}
        />

        <FeedbackPanel issueId={issue.id} tags={issue.tags} />

        <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Premium Slot</div>
          <h3 className="mb-1 text-base font-semibold text-ink">Deeper Mood Layers</h3>
          <p className="text-sm leading-6 text-muted">
            This space is reserved for gated insights like audience splits, fatigue signals, and campaign-ready summaries.
          </p>
        </section>
      </div>
    </div>
  );
}

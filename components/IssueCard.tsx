import Link from "next/link";
import type { IssueSummary } from "@/lib/types";
import { EmotionBar } from "@/components/EmotionBar";
import { VerdictBadge } from "@/components/VerdictBadge";

interface IssueCardProps {
  issue: IssueSummary;
}

const trendLabel: Record<IssueSummary["trend"], string> = {
  heating: "Heating up",
  cooling: "Cooling down",
  stable: "Holding steady"
};

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <Link
      href={`/issue/${issue.slug}`}
      className="group block rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow transition hover:-translate-y-0.5 hover:border-white/10"
      aria-label={`${issue.title} issue details`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {issue.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-lg font-semibold leading-tight text-ink sm:text-xl">{issue.title}</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted">
          {trendLabel[issue.trend]}
        </div>
      </div>

      <p className="mb-4 text-sm leading-6 text-muted">{issue.context}</p>

      <div className="mb-4 grid grid-cols-1 gap-3">
        <EmotionBar label="Anger" value={issue.scores.anger} tone="anger" size="sm" />
        <EmotionBar label="Humor" value={issue.scores.humor} tone="humor" size="sm" />
        <EmotionBar label="Division" value={issue.scores.division} tone="division" size="sm" />
      </div>

      <div className="flex items-center justify-between">
        <VerdictBadge label={issue.verdict.label} tone={issue.verdict.tone} />
        <div className="text-xs font-medium uppercase tracking-wide text-muted">Updated {issue.updatedAt}</div>
      </div>
    </Link>
  );
}

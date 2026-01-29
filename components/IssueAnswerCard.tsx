import type { IssueDetail } from "@/lib/types";

interface IssueAnswerCardProps {
  issue: IssueDetail;
}

export function IssueAnswerCard({ issue }: IssueAnswerCardProps) {
  return (
    <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Answer in 10 seconds</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
          GEO Summary
        </div>
      </div>
      <p className="mb-4 text-sm leading-6 text-muted">
        {issue.title} — {issue.verdict.label}. Dominant mood: {issue.dominantEmotion}.
      </p>
      <ul className="grid grid-cols-1 gap-2 text-sm leading-6 text-ink">
        {issue.quickSummary.map((line) => (
          <li key={line} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

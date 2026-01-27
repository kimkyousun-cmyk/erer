import type { DominantEmotion } from "@/lib/types";

interface VerdictBadgeProps {
  label: string;
  tone: DominantEmotion;
}

const badgeStyles: Record<DominantEmotion, string> = {
  anger: "border-red-400/30 bg-red-500/15 text-red-200",
  humor: "border-amber-300/40 bg-amber-400/15 text-amber-100",
  division: "border-violet-400/30 bg-violet-500/15 text-violet-100",
  calm: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
};

export function VerdictBadge({ label, tone }: VerdictBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeStyles[tone]}`}
      role="status"
      aria-label={`Verdict: ${label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </div>
  );
}

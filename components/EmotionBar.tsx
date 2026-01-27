import type { EmotionKey } from "@/lib/types";

interface EmotionBarProps {
  label: string;
  value: number;
  tone: EmotionKey | "calm";
  size?: "sm" | "md" | "lg";
}

const toneStyles: Record<EmotionBarProps["tone"], { track: string; fill: string; glow: string }> = {
  anger: {
    track: "bg-red-500/10",
    fill: "from-red-500 to-rose-400",
    glow: "shadow-[0_0_24px_rgba(255,77,79,0.25)]"
  },
  humor: {
    track: "bg-amber-400/10",
    fill: "from-amber-400 to-yellow-300",
    glow: "shadow-[0_0_24px_rgba(247,181,0,0.22)]"
  },
  division: {
    track: "bg-violet-500/10",
    fill: "from-violet-500 to-indigo-400",
    glow: "shadow-[0_0_24px_rgba(124,92,255,0.28)]"
  },
  calm: {
    track: "bg-emerald-400/10",
    fill: "from-emerald-400 to-teal-300",
    glow: "shadow-[0_0_24px_rgba(45,212,191,0.2)]"
  }
};

const sizeStyles: Record<NonNullable<EmotionBarProps["size"]>, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4"
};

export function EmotionBar({ label, value, tone, size = "md" }: EmotionBarProps) {
  const toneStyle = toneStyles[tone];
  const height = sizeStyles[size];

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span className="font-medium uppercase tracking-wide">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
      <div className={`relative w-full overflow-hidden rounded-full ${toneStyle.track} ${height}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${toneStyle.fill} ${toneStyle.glow} transition-all duration-500`}
          style={{ width: `${Math.max(4, value)}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

import type { TimelinePhase } from "@/lib/types";
import { clamp } from "@/lib/utils";

interface EmotionTrendChartProps {
  timeline: TimelinePhase[];
}

function pointFor(index: number, total: number, intensity: number) {
  const width = 320;
  const height = 120;
  const paddingX = 16;
  const paddingY = 20;

  const safeTotal = Math.max(total - 1, 1);
  const x = paddingX + ((width - paddingX * 2) * index) / safeTotal;
  const normalized = clamp(intensity, 0, 100) / 100;
  const y = height - paddingY - normalized * (height - paddingY * 2);

  return { x, y };
}

export function EmotionTrendChart({ timeline }: EmotionTrendChartProps) {
  const points = timeline.map((phase, index) => pointFor(index, timeline.length, phase.intensity));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${points[0]?.x ?? 0},120 L ${line} L ${points[points.length - 1]?.x ?? 0},120 Z`;

  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Emotion Trend</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Timeline intensity</div>
      </div>

      <svg viewBox="0 0 320 120" className="h-28 w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="320" height="120" rx="18" fill="rgba(255,255,255,0.04)" />
        <path d={area} fill="url(#trendFill)" />
        <polyline
          fill="none"
          stroke="#a78bfa"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
        {points.map((point, index) => (
          <circle key={timeline[index]?.key ?? index} cx={point.x} cy={point.y} r="4" fill="#f5f3ff" />
        ))}
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-4">
        {timeline.map((phase) => (
          <div
            key={phase.key}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center font-semibold uppercase tracking-wide"
          >
            {phase.label}
            <div className="mt-1 text-[11px] font-medium text-ink">{phase.intensity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

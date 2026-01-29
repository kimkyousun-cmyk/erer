export function IssueCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/5 bg-panel/60 p-5 shadow-glow">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-white/10" />
          </div>
          <div className="h-5 w-48 rounded bg-white/10" />
        </div>
        <div className="h-8 w-24 rounded-2xl bg-white/10" />
      </div>
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-5/6 rounded bg-white/10" />
      </div>
      <div className="mb-4 space-y-3">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-6 w-24 rounded-full bg-white/10" />
        <div className="h-3 w-24 rounded bg-white/10" />
      </div>
    </div>
  );
}

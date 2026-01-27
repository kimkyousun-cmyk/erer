import type { Metadata } from "next";
import { JobRunRepo } from "@/repositories/jobRunRepo";

export const metadata: Metadata = {
  title: "Job Runs"
};

function parseMeta(metaJson: string | null) {
  if (!metaJson) return null;
  try {
    return JSON.parse(metaJson) as Record<string, unknown>;
  } catch {
    return { raw: metaJson };
  }
}

export default async function AdminJobsPage() {
  const runs = await JobRunRepo.listRecent(undefined, 50);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Job Runs</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Cron endpoints record every run with status, timing, and error context. Use this page to spot failures fast.
        </p>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent Runs</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {runs.length}
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">No job runs recorded yet.</div>
        ) : (
          <ul className="space-y-2">
            {runs.map((run) => {
              const meta = parseMeta(run.metaJson);
              return (
                <li key={run.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{run.jobName}</span>
                      <span>{run.startedAt.toISOString().slice(0, 19).replace("T", " ")}</span>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        run.status === "SUCCEEDED"
                          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
                          : run.status === "FAILED"
                            ? "border-rose-300/40 bg-rose-400/10 text-rose-100"
                            : "border-amber-300/40 bg-amber-400/10 text-amber-100"
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  {run.errorMessage ? (
                    <div className="mb-2 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                      {run.errorMessage}
                    </div>
                  ) : null}

                  {meta ? (
                    <div className="rounded-2xl border border-white/5 bg-surface/60 p-3 text-xs text-muted">
                      <div className="mb-1 font-semibold uppercase tracking-wide text-ink">Meta</div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(meta, null, 2)}</pre>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

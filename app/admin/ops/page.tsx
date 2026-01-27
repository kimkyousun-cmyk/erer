import type { Metadata } from "next";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo";
import { getOpsSnapshot } from "@/services/ops/opsService";

export const metadata: Metadata = {
  title: "Ops Dashboard",
  robots: { index: false, follow: false }
};

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function tone(value: boolean) {
  return value ? "text-rose-200" : "text-emerald-200";
}

export default async function AdminOpsPage() {
  const snapshot = await getOpsSnapshot();
  const demoMode = isDemoMode();

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Ops Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Incident-friendly visibility: panic switches, job failures, and operational freshness.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/jobs"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Job Runs
          </Link>
          <Link
            href="/admin/experiments"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Experiments
          </Link>
          <Link
            href="/admin/ready"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Ready Check
          </Link>
        </div>
      </header>

      {demoMode ? (
        <section className="rounded-3xl border border-amber-300/40 bg-amber-400/10 p-5 text-sm font-semibold text-amber-100 shadow-glow">
          DEMO_MODE is enabled. Ops signals and DB-backed workflows may be intentionally bypassed.
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Panic Switches</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Env-driven
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {Object.entries(snapshot.panic).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{key}</div>
              <div className={`text-base font-semibold ${tone(Boolean(value))}`}>{value ? "ON" : "OFF"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Last 24h</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Jobs
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Total runs</div>
            <div className="text-2xl font-semibold text-ink">{snapshot.last24h.total}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Failures</div>
            <div className="text-2xl font-semibold text-rose-200">{snapshot.last24h.failures}</div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Failure rate</div>
            <div className="text-2xl font-semibold text-ink">{pct(snapshot.last24h.failureRate)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent Job Runs</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {snapshot.runs.length}
          </div>
        </div>

        {snapshot.runs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">No job runs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="px-2 py-1">Job</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Started</th>
                  <th className="px-2 py-1">Finished</th>
                  <th className="px-2 py-1">Error</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.runs.map((run) => (
                  <tr key={run.id} className="border-t border-white/5 text-ink">
                    <td className="px-2 py-1 font-semibold">{run.jobName}</td>
                    <td className={`px-2 py-1 font-semibold ${run.status === "FAILED" ? "text-rose-200" : run.status === "SUCCEEDED" ? "text-emerald-200" : "text-amber-200"}`}>
                      {run.status}
                    </td>
                    <td className="px-2 py-1">{run.startedAt.toISOString().replace("T", " ").slice(0, 16)}</td>
                    <td className="px-2 py-1">{run.finishedAt ? run.finishedAt.toISOString().replace("T", " ").slice(0, 16) : "-"}</td>
                    <td className="px-2 py-1 text-rose-200">{run.errorMessage ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

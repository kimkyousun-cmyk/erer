import type { Metadata } from "next";
import Link from "next/link";
import { CsrfTokenField } from "@/components/CsrfTokenField";
import { upsertExperimentAction } from "@/app/admin/experiments/actions";
import { listExperimentsWithMetrics } from "@/services/experiments/adminExperimentService";

export const metadata: Metadata = {
  title: "Experiments",
  robots: { index: false, follow: false }
};

type Status = "DRAFT" | "RUNNING" | "PAUSED" | "ENDED";
const statuses: Status[] = ["DRAFT", "RUNNING", "PAUSED", "ENDED"];

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function tone(status: string) {
  if (status === "RUNNING") return "border-emerald-300/40 bg-emerald-400/10 text-emerald-100";
  if (status === "PAUSED") return "border-amber-300/40 bg-amber-400/10 text-amber-100";
  if (status === "ENDED") return "border-white/15 bg-white/5 text-muted";
  return "border-violet-300/40 bg-violet-500/10 text-violet-100";
}

export default async function AdminExperimentsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const ok = readParam(searchParams?.ok) === "1";
  const message = readParam(searchParams?.message);

  const experiments = await listExperimentsWithMetrics();

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Experiments</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Run lightweight A/B tests with stable session assignment. Keep variants small and measurable.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/issues"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Editorial Issues
          </Link>
          <Link
            href="/admin/feedback"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Feedback Queue
          </Link>
        </div>
      </header>

      {message ? (
        <div
          className={`rounded-3xl border p-4 text-sm font-semibold ${
            ok
              ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
              : "border-rose-300/40 bg-rose-400/10 text-rose-100"
          }`}
          role="status"
        >
          {message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h2 className="mb-3 text-lg font-semibold text-ink">Create / Update Experiment</h2>
        <form action={upsertExperimentAction} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <CsrfTokenField />
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Key
            <input
              name="key"
              placeholder="HOME_LAYOUT_DENSITY"
              required
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Status
            <select
              name="status"
              defaultValue="DRAFT"
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-ink outline-none focus:border-white/20"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Variants (one per line: name:weight)
            <textarea
              name="variants"
              rows={5}
              defaultValue={`control:50\nvariantA:50`}
              className="min-h-[120px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-ink outline-none focus:border-white/20"
            />
          </label>
          <button
            type="submit"
            className="md:col-span-2 h-11 rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Save Experiment
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Existing Experiments</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {experiments.length}
          </div>
        </div>

        {experiments.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">
            No experiments yet. Create one above, set status to RUNNING, and it will start assigning variants.
          </div>
        ) : (
          <ul className="space-y-3">
            {experiments.map((exp) => (
              <li key={exp.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-base font-semibold text-ink">{exp.key}</div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tone(exp.status)}`}>
                    {exp.status}
                  </span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {exp.variants.map((variant) => (
                    <span key={`${exp.id}-${variant.name}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                      {variant.name}:{variant.weight}
                    </span>
                  ))}
                </div>

                {exp.metrics.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead className="text-muted">
                        <tr>
                          <th className="px-2 py-1">Variant</th>
                          <th className="px-2 py-1">Exposures</th>
                          <th className="px-2 py-1">Opens</th>
                          <th className="px-2 py-1">Shares</th>
                          <th className="px-2 py-1">Votes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exp.metrics.map((m) => (
                          <tr key={`${exp.id}-${m.variantName}`} className="border-t border-white/5 text-ink">
                            <td className="px-2 py-1 font-semibold">{m.variantName}</td>
                            <td className="px-2 py-1">{m.exposures}</td>
                            <td className="px-2 py-1">{m.opens}</td>
                            <td className="px-2 py-1">{m.shares}</td>
                            <td className="px-2 py-1">{m.votes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-xs text-muted">No metrics yet. Metrics populate after traffic flows through this experiment.</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

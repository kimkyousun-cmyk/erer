import type { Metadata } from "next";
import { addSeedAction, rejectSeedAction } from "@/app/admin/seeds/actions";
import { CsrfTokenField } from "@/components/CsrfTokenField";
import { SeedQueueService } from "@/services/seed/seedQueueService";

export const metadata: Metadata = {
  title: "Seed Queue",
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminSeedsPage() {
  const [pending, rejected, used] = await Promise.all([
    SeedQueueService.list("PENDING"),
    SeedQueueService.list("REJECTED"),
    SeedQueueService.list("USED")
  ]);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Seed Queue</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Safe inputs only. URLs are stripped, personal data is blocked, and full-name seeds are rejected by default.
        </p>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h2 className="mb-3 text-lg font-semibold text-ink">Add Seed</h2>
        <form action={addSeedAction} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <CsrfTokenField />
          <textarea
            name="text"
            required
            minLength={8}
            maxLength={400}
            placeholder="Describe an abstract topic, not a specific private person..."
            className="min-h-[96px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-ink outline-none transition focus:border-white/20"
          />
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Source
            <select
              name="sourceType"
              defaultValue="MANUAL"
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-ink outline-none focus:border-white/20"
            >
              <option value="MANUAL">Manual</option>
              <option value="RSS">RSS</option>
              <option value="USER_SUBMIT">User Submit</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="h-11 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
            >
              Add to Queue
            </button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Pending Seeds</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {pending.length}
            </div>
          </div>

          {pending.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">No pending seeds yet.</div>
          ) : (
            <ul className="space-y-2">
              {pending.map((seed) => (
                <li key={seed.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{seed.sourceType}</span>
                      <span>{seed.createdAt.toISOString().slice(0, 10)}</span>
                    </div>
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-100">
                      {seed.status}
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-6 text-ink">{seed.text}</p>

                  <form action={rejectSeedAction} className="flex flex-col gap-2 md:flex-row">
                    <CsrfTokenField />
                    <input type="hidden" name="id" value={seed.id} />
                    <input
                      name="reason"
                      placeholder="Reject reason (optional)"
                      className="h-10 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
                    />
                    <button
                      type="submit"
                      className="h-10 rounded-2xl border border-rose-300/40 bg-rose-500/15 px-4 text-sm font-semibold text-rose-100 transition hover:border-rose-200/60"
                    >
                      Reject
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Rejected</h3>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {rejected.length}
              </div>
            </div>
            <ul className="space-y-2">
              {rejected.slice(0, 8).map((seed) => (
                <li key={seed.id} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-ink">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{seed.rejectReason ?? "Rejected"}</div>
                  {seed.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Used</h3>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                {used.length}
              </div>
            </div>
            <ul className="space-y-2">
              {used.slice(0, 8).map((seed) => (
                <li key={seed.id} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-ink">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{seed.usedAt?.toISOString().slice(0, 10) ?? "Used"}</div>
                  {seed.text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}

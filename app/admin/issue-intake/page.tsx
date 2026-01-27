import type { Metadata } from "next";
import { intakeIssueAction } from "@/app/admin/issue-intake/actions";
import { CsrfTokenField } from "@/components/CsrfTokenField";

export const metadata: Metadata = {
  title: "Issue Intake",
  robots: { index: false, follow: false }
};

interface IntakePageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function IssueIntakePage({ searchParams }: IntakePageProps) {
  const ok = readParam(searchParams?.ok) === "1";
  const message = readParam(searchParams?.message);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Issue Intake</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Create safe drafts from abstract seed text. The generator never auto-publishes.
        </p>
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
        <form action={intakeIssueAction} className="space-y-4">
          <CsrfTokenField />

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Seed Text
            <textarea
              name="seedText"
              required
              minLength={12}
              maxLength={400}
              placeholder="Example: A city adds AI noise monitors in apartment hallways and people debate whether it protects sleep or normalizes surveillance."
              className="min-h-[140px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-ink outline-none transition focus:border-white/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Tags (comma separated)
              <input
                name="tags"
                placeholder="policy, privacy, city-life"
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Sensitivity
              <select
                name="sensitivity"
                defaultValue="SAFE"
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-ink outline-none focus:border-white/20"
              >
                <option value="SAFE">SAFE</option>
                <option value="CAUTIOUS">CAUTIOUS</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="h-11 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Generate Draft
          </button>
        </form>
      </section>
    </main>
  );
}

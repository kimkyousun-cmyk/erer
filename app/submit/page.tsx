import type { Metadata } from "next";
import { submitSeedAction } from "@/app/submit/actions";

export const metadata: Metadata = {
  title: "Suggest a Topic",
  description: "Suggest an abstract topic for Emotion Radar. No personal data or direct targeting."
};

interface SubmitPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function SubmitPage({ searchParams }: SubmitPageProps) {
  const ok = readParam(searchParams?.ok) === "1";
  const message = readParam(searchParams?.message);
  const status = readParam(searchParams?.status);
  const reason = readParam(searchParams?.reason);

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Community</p>
        <h1 className="text-3xl font-semibold text-ink">Suggest a Topic</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          We only accept abstract topics. Do not include names, links, or personal details. All submissions are reviewed.
        </p>
      </header>

      {message ? (
        <div
          className={`rounded-3xl border p-4 text-sm font-semibold ${
            ok
              ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
              : "border-amber-300/40 bg-amber-400/10 text-amber-100"
          }`}
          role="status"
        >
          <div>{message}</div>
          {status ? <div className="mt-1 text-xs uppercase tracking-wide text-muted">Status: {status}</div> : null}
          {reason ? <div className="mt-1 text-xs text-muted">Note: {reason}</div> : null}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <form action={submitSeedAction} className="space-y-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Topic Suggestion
            <textarea
              name="text"
              required
              minLength={8}
              maxLength={400}
              placeholder="Example: A school introduces AI hall monitors and people debate whether it helps or harms trust."
              className="min-h-[140px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-ink outline-none transition focus:border-white/20"
            />
          </label>

          <div className="flex flex-col gap-2 text-xs text-muted">
            <div>What to do:</div>
            <div>- Describe the tension or feeling, not private people.</div>
            <div>- Keep it short and general.</div>
            <div>- Avoid links and personal data.</div>
          </div>

          <button
            type="submit"
            className="h-11 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Submit Topic
          </button>
        </form>
      </section>
    </main>
  );
}

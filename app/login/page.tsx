import type { Metadata } from "next";
import { loginAction, readLoginError } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false }
};

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = readLoginError(searchParams);
  const next = typeof searchParams?.next === "string" ? searchParams.next : "/";

  return (
    <main className="mx-auto max-w-md space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Account</p>
        <h1 className="text-3xl font-semibold text-ink">Login</h1>
        <p className="mt-2 text-sm leading-6 text-muted">We use a lightweight mock login for now. Use any email.</p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-300/40 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100" role="alert">
          {error}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <form action={loginAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
            />
          </label>
          <button
            type="submit"
            className="h-11 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Continue
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 text-xs leading-5 text-muted shadow-glow">
        Tip: seeded users include <span className="text-ink">free@emotionradar.dev</span> and <span className="text-ink">pro@emotionradar.dev</span>.
      </section>
    </main>
  );
}

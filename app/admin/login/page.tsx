import type { Metadata } from "next";
import Link from "next/link";
import { adminLoginAction } from "@/app/admin/login/actions";
import { requiresAdminPassword } from "@/lib/security/adminAuth";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false }
};

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function AdminLoginPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const next = readParam(searchParams?.next) ?? "/admin/issues";
  const error = readParam(searchParams?.error);

  if (!requiresAdminPassword()) {
    return (
      <main className="space-y-6">
        <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h1 className="text-3xl font-semibold text-ink">Admin Access</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            ADMIN_PASSWORD is not set, so admin routes are currently open.
          </p>
          <div className="mt-3">
            <Link
              href="/admin/issues"
              className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-200/60"
            >
              Continue to Admin
            </Link>
          </div>
        </header>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h1 className="text-3xl font-semibold text-ink">Admin Login</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This gate protects editorial and operations tooling. Access is controlled by ADMIN_PASSWORD.
        </p>
      </header>

      {error === "invalid_password" ? (
        <div className="rounded-3xl border border-rose-300/40 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
          Invalid admin password.
        </div>
      ) : null}

      <section className="max-w-md rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <form action={adminLoginAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Admin password
            <input
              type="password"
              name="password"
              required
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
            />
          </label>
          <button
            type="submit"
            className="h-11 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Unlock Admin
          </button>
        </form>
      </section>
    </main>
  );
}

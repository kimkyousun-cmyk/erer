import type { Metadata } from "next";
import { CsrfTokenField } from "@/components/CsrfTokenField";
import { UserRepo } from "@/repositories/userRepo";
import { setPlanAction } from "@/app/admin/users/actions";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false }
};

export default async function AdminUsersPage() {
  const users = await UserRepo.listUsers(80);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Users & Plans</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Mock billing controls. Toggle FREE vs PRO to test feature gates and exports.
        </p>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Users</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {users.length}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">No users yet. Use /login to create one.</div>
        ) : (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ink">{user.plan}</span>
                    <span>{user.createdAt.toISOString().slice(0, 10)}</span>
                  </div>
                  <div>{user.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <form action={setPlanAction}>
                    <CsrfTokenField />
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="plan" value="FREE" />
                    <button
                      type="submit"
                      className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
                    >
                      Set FREE
                    </button>
                  </form>
                  <form action={setPlanAction}>
                    <CsrfTokenField />
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="plan" value="PRO" />
                    <button
                      type="submit"
                      className="h-10 w-full rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-3 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-200/60"
                    >
                      Set PRO
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

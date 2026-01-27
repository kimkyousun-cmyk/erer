import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { CsrfTokenField } from "@/components/CsrfTokenField";
import { getUserSession } from "@/lib/auth/userSession";
import { requireFeature } from "@/services/featureGateService";
import { ApiKeyRepo } from "@/repositories/apiKeyRepo";
import { createApiKeyAction, revokeApiKeyAction } from "@/app/account/api-keys/actions";

export const metadata: Metadata = {
  title: "API Keys",
  robots: { index: false, follow: false }
};

const FLASH_COOKIE = "api_key_flash";

export default async function ApiKeysPage() {
  const session = await getUserSession();
  const flash = cookies().get(FLASH_COOKIE)?.value ?? null;

  if (!session) {
    return (
      <main className="mx-auto max-w-xl space-y-6">
        <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h1 className="text-3xl font-semibold text-ink">API Keys</h1>
          <p className="mt-2 text-sm text-muted">Login is required to manage API access.</p>
          <div className="mt-4">
            <Link
              href="/login?next=/account/api-keys"
              className="rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
            >
              Login
            </Link>
          </div>
        </header>
      </main>
    );
  }

  const gate = await requireFeature("API_ACCESS");
  if (!gate.ok) {
    return (
      <main className="mx-auto max-w-xl space-y-6">
        <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <h1 className="text-3xl font-semibold text-ink">API Keys</h1>
          <p className="mt-2 text-sm text-muted">API access is a PRO feature.</p>
          <div className="mt-4 flex items-center gap-2">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/60"
            >
              Upgrade (Admin)
            </Link>
          </div>
        </header>
      </main>
    );
  }

  const keys = await ApiKeyRepo.listForUser(session.user.id);

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ink">{session.plan}</span>
          <span>{session.user.email}</span>
        </div>
        <h1 className="text-3xl font-semibold text-ink">API Keys</h1>
        <p className="mt-2 text-sm text-muted">Keys are shown once. Store them securely.</p>
      </header>

      {flash ? (
        <div className="rounded-3xl border border-emerald-300/40 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-100" role="status">
          {flash}
        </div>
      ) : null}

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h2 className="mb-3 text-lg font-semibold text-ink">Create Key</h2>
        <form action={createApiKeyAction} className="flex flex-col gap-2 md:flex-row">
          <CsrfTokenField />
          <input
            name="name"
            placeholder="Key name"
            className="h-11 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
          />
          <button
            type="submit"
            className="h-11 rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Create
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Your Keys</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {keys.length}
          </div>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">No keys yet.</div>
        ) : (
          <ul className="space-y-2">
            {keys.map((key) => (
              <li key={key.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-ink">
                      {key.revokedAt ? "revoked" : "active"}
                    </span>
                    <span>{key.createdAt.toISOString().slice(0, 10)}</span>
                  </div>
                  <div>{key.name}</div>
                </div>

                <form action={revokeApiKeyAction} className="flex">
                  <CsrfTokenField />
                  <input type="hidden" name="id" value={key.id} />
                  <button
                    type="submit"
                    className="h-10 rounded-2xl border border-rose-300/40 bg-rose-500/15 px-4 text-xs font-semibold uppercase tracking-wide text-rose-100 transition hover:border-rose-200/60"
                    disabled={Boolean(key.revokedAt)}
                  >
                    Revoke
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

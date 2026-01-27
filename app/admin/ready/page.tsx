import type { Metadata } from "next";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Deployment Readiness",
  robots: { index: false, follow: false }
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type HealthPayload = {
  ok?: boolean;
  mode?: string;
  db?: Record<string, unknown>;
  jobs?: unknown[];
  panic?: Record<string, unknown>;
} & Record<string, unknown>;

async function loadHealth(): Promise<HealthPayload> {
  try {
    const url = new URL("/api/health", siteUrl).toString();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, error: `Health failed (${res.status})` };
    return (await res.json()) as HealthPayload;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function checkEnv(name: string, opts?: { allowEmpty?: boolean }) {
  const value = process.env[name];
  const ok = opts?.allowEmpty ? true : Boolean(value && value.length > 0);
  return { name, ok, value: value ?? "" };
}

function tone(ok: boolean) {
  return ok
    ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
    : "border-rose-300/40 bg-rose-400/10 text-rose-100";
}

export default async function AdminReadyPage() {
  const health = await loadHealth();
  const demoMode = isDemoMode();

  const envChecks = [
    checkEnv("NEXT_PUBLIC_SITE_URL"),
    checkEnv("CRON_SECRET"),
    checkEnv("SESSION_SECRET"),
    checkEnv("API_KEYS_SALT"),
    checkEnv("SHORTS_WEBHOOK_SECRET"),
    checkEnv("ADMIN_PASSWORD")
  ];

  const envOk = envChecks.every((c) => c.ok);
  const overallOk = Boolean(health.ok) && envOk && !demoMode;

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Deployment Readiness</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          A single place to sanity-check environment config, health, and known failure modes before going public.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/ops"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Ops Dashboard
          </Link>
          <Link
            href="/status"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Public Status
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Overall</div>
        <div className={`inline-flex rounded-2xl border px-3 py-2 text-sm font-semibold uppercase tracking-wide ${tone(overallOk)}`}>
          {overallOk ? "Ready" : demoMode ? "Demo Mode Enabled" : "Not Ready"}
        </div>
        {demoMode ? (
          <p className="mt-2 text-sm text-amber-100">
            DEMO_MODE is on. This is useful for previews but should be off in production.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Environment</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {envChecks.filter((c) => c.ok).length}/{envChecks.length}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {envChecks.map((check) => (
            <div key={check.name} className={`rounded-2xl border p-4 text-sm ${tone(check.ok)}`}>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{check.name}</div>
              <div className="mt-1 font-semibold">{check.ok ? "set" : "missing"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Health</h2>
          <div className={`rounded-2xl border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone(Boolean(health.ok))}`}>
            {health.ok ? "ok" : "degraded"}
          </div>
        </div>
        <pre className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-muted">
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h2 className="mb-2 text-lg font-semibold text-ink">Launch Checklist</h2>
        <ul className="space-y-1 text-sm text-muted">
          <li>1. DEMO_MODE=false</li>
          <li>2. ADMIN_PASSWORD set</li>
          <li>3. Cron configured for /api/cron/hourly and /api/cron/daily</li>
          <li>4. /api/health returns ok=true</li>
          <li>5. Panic switches all OFF</li>
        </ul>
      </section>
    </main>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status",
  description: "Service health snapshot for Emotion Radar."
};

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function loadHealth() {
  const url = new URL("/api/health", siteUrl).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return { ok: false, error: `Health check failed (${res.status})` } as const;
  }
  return (await res.json()) as Record<string, unknown>;
}

export default async function StatusPage() {
  const health = await loadHealth();
  const ok = Boolean((health as { ok?: boolean })?.ok);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <h1 className="text-3xl font-semibold text-ink">Status</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Public snapshot of service health.</p>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Overall</div>
        <div className={`text-2xl font-semibold ${ok ? "text-emerald-200" : "text-rose-200"}`}>
          {ok ? "Operational" : "Degraded"}
        </div>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-muted">
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>
    </main>
  );
}

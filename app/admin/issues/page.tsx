import type { Metadata } from "next";
import Link from "next/link";
import { listAdminIssues } from "@/services/issues/adminIssueService";

export const metadata: Metadata = {
  title: "Editorial Issues",
  robots: { index: false, follow: false }
};

type IssueStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";

const statuses: IssueStatus[] = ["DRAFT", "IN_REVIEW", "PUBLISHED", "ARCHIVED"];

interface AdminIssuesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseStatus(raw: string | undefined): IssueStatus {
  if (raw && statuses.includes(raw as IssueStatus)) return raw as IssueStatus;
  return "DRAFT";
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 4);
}

function parseFlags(flags: string | null | undefined) {
  if (!flags) return [] as string[];
  return flags
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function qualityTone(action: string | undefined) {
  if (action === "PASS") return "border-emerald-300/40 bg-emerald-400/10 text-emerald-100";
  if (action === "BLOCK_PUBLISH") return "border-rose-300/40 bg-rose-400/10 text-rose-100";
  return "border-amber-300/40 bg-amber-400/10 text-amber-100";
}

export default async function AdminIssuesPage({ searchParams }: AdminIssuesPageProps) {
  const status = parseStatus(readParam(searchParams?.status));
  const issues = await listAdminIssues(status);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin</p>
        <h1 className="text-3xl font-semibold text-ink">Editorial Workflow</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Drafts never auto-publish. Move items into review, edit safely, and publish when the language is clean.
        </p>
      </header>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-4 shadow-glow">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/admin/issues?status=${s}`}
              className={`rounded-2xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                s === status
                  ? "border-violet-300/50 bg-violet-500/20 text-violet-100"
                  : "border-white/10 bg-white/5 text-muted hover:border-white/20"
              }`}
            >
              {s}
            </Link>
          ))}
          <div className="ml-auto flex items-center">
            <Link
              href="/admin/issue-intake"
              className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-200/60"
            >
              New Draft
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{status}</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {issues.length}
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-muted">
            No issues in this state yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue) => {
              const latestQuality = issue.qualityReports?.[0];
              const flags = parseFlags(latestQuality?.flags);
              return (
                <li key={issue.id} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                  {latestQuality ? (
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                      <span className={`rounded-full border px-2.5 py-1 ${qualityTone(latestQuality.action)}`}>
                        quality {latestQuality.qualityScore} · {latestQuality.action}
                      </span>
                      {flags.map((flag) => (
                        <span
                          key={`${issue.id}-dq-${flag}`}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    <div className="flex flex-wrap items-center gap-2">
                      {parseTags(issue.tags).map((tag) => (
                        <span key={`${issue.id}-${tag}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                          {tag}
                        </span>
                      ))}
                      {issue.requiresEdit ? (
                        <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2.5 py-1 text-amber-100">
                          requires_edit
                        </span>
                      ) : null}
                    </div>
                    <div>{issue.updatedAt.toISOString().slice(0, 10)}</div>
                  </div>

                  <div className="mb-2 text-base font-semibold text-ink">{issue.title}</div>
                  <p className="mb-3 text-sm leading-6 text-muted">{issue.contextSummary}</p>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/issues/${issue.id}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
                    >
                      Open Editor
                    </Link>
                    {issue.slug ? (
                      <Link
                        href={`/issue/${issue.slug}`}
                        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
                      >
                        View Public
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

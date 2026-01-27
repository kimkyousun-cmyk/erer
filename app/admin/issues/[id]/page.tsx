import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminIssueById } from "@/services/issues/adminIssueService";
import {
  regenerateReactionsAction,
  transitionIssueAction,
  updateIssueAction
} from "@/app/admin/issues/[id]/actions";
import { CsrfTokenField } from "@/components/CsrfTokenField";

export const metadata: Metadata = {
  title: "Issue Editor",
  robots: { index: false, follow: false }
};

interface IssueEditorPageProps {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 5);
}

function parseFlags(flags: string | null | undefined) {
  if (!flags) return [] as string[];
  return flags
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function qualityTone(action: string | undefined) {
  if (action === "PASS") return "border-emerald-300/40 bg-emerald-400/10 text-emerald-100";
  if (action === "BLOCK_PUBLISH") return "border-rose-300/40 bg-rose-400/10 text-rose-100";
  return "border-amber-300/40 bg-amber-400/10 text-amber-100";
}

export default async function IssueEditorPage({ params, searchParams }: IssueEditorPageProps) {
  const issue = await getAdminIssueById(params.id);
  if (!issue) notFound();

  const ok = readParam(searchParams?.ok) === "1";
  const message = readParam(searchParams?.message);

  const tags = parseTags(issue.tags);
  const latestQuality = issue.qualityReports?.[0];
  const qualityFlags = parseFlags(latestQuality?.flags);

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{issue.status}</span>
          {issue.requiresEdit ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2.5 py-1 text-amber-100">
              requires_edit
            </span>
          ) : null}
          {latestQuality ? (
            <span className={`rounded-full border px-2.5 py-1 ${qualityTone(latestQuality.action)}`}>
              quality {latestQuality.qualityScore} · {latestQuality.action}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold text-ink">Issue Editor</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Edit safely, move to review, and publish only when the language stays abstract and compliant.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/issues"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-white/20"
          >
            Back to List
          </Link>
          <Link
            href={`/issue/${issue.slug}`}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
          >
            View Public
          </Link>
        </div>
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

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form action={updateIssueAction} className="space-y-4 rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow">
          <CsrfTokenField />
          <input type="hidden" name="id" value={issue.id} />

          <div className="grid grid-cols-1 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Title
              <input
                name="title"
                defaultValue={issue.title}
                minLength={8}
                maxLength={60}
                required
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Context Summary
              <textarea
                name="contextSummary"
                defaultValue={issue.contextSummary}
                minLength={20}
                maxLength={240}
                required
                className="min-h-[120px] rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Verdict Line
              <input
                name="verdictLine"
                defaultValue={issue.verdictLine}
                minLength={8}
                maxLength={70}
                required
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Dominant Emotion
              <select
                name="dominantEmotion"
                defaultValue={issue.dominantEmotion}
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-ink outline-none focus:border-white/20"
              >
                <option value="ANGER">ANGER</option>
                <option value="HUMOR">HUMOR</option>
                <option value="DIVISION">DIVISION</option>
                <option value="MIXED">MIXED</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Tags (comma separated)
              <input
                name="tags"
                defaultValue={tags.join(", ")}
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Anger Score
              <input
                type="number"
                name="angerScore"
                defaultValue={issue.angerScore}
                min={0}
                max={100}
                required
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Humor Score
              <input
                type="number"
                name="humorScore"
                defaultValue={issue.humorScore}
                min={0}
                max={100}
                required
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Division Score
              <input
                type="number"
                name="divisionScore"
                defaultValue={issue.divisionScore}
                min={0}
                max={100}
                required
                className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Note (optional)
            <input
              name="note"
              placeholder="Why this change was made"
              className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
            />
          </label>

          <button
            type="submit"
            className="h-11 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-4 text-sm font-semibold text-violet-100 transition hover:border-violet-200/60"
          >
            Save Changes
          </button>
        </form>

        <div className="space-y-4">
          <section className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
            <h2 className="mb-2 text-base font-semibold text-ink">Quality Gate</h2>
            {latestQuality ? (
              <div className="space-y-2 text-sm text-muted">
                <div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${qualityTone(latestQuality.action)}`}>
                  score {latestQuality.qualityScore} · {latestQuality.action}
                </div>
                <p className="text-sm leading-6 text-muted">{latestQuality.explanation}</p>
                {qualityFlags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {qualityFlags.map((flag) => (
                      <span
                        key={`${issue.id}-quality-${flag}`}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-muted">
                  Publish attempts run DQ again. BLOCK_PUBLISH will stop publishing unless unsafe publish is explicitly enabled.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">No quality report yet. It will be created on draft generation and publish attempts.</p>
            )}
          </section>

          <section className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
            <h2 className="mb-3 text-base font-semibold text-ink">Workflow</h2>
            <form action={transitionIssueAction} className="space-y-2">
              <CsrfTokenField />
              <input type="hidden" name="id" value={issue.id} />
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Move To
                <select
                  name="toStatus"
                  defaultValue={issue.status}
                  className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-ink outline-none focus:border-white/20"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="IN_REVIEW">IN_REVIEW</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </label>
              <input
                name="note"
                placeholder="Transition note (optional)"
                className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-ink outline-none focus:border-white/20"
              />
              <button
                type="submit"
                className="h-10 w-full rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-100 transition hover:border-emerald-200/60"
              >
                Apply Status
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
            <h2 className="mb-3 text-base font-semibold text-ink">Reactions</h2>
            <form action={regenerateReactionsAction} className="space-y-2">
              <CsrfTokenField />
              <input type="hidden" name="id" value={issue.id} />
              <button
                type="submit"
                className="h-10 w-full rounded-2xl border border-amber-300/40 bg-amber-500/15 px-4 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60"
              >
                Regenerate Reactions
              </button>
            </form>
            <p className="mt-2 text-xs text-muted">Regeneration is simulated and never uses real quotes.</p>
          </section>

          <section className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
            <h2 className="mb-2 text-base font-semibold text-ink">Snapshot</h2>
            <div className="space-y-2 text-xs text-muted">
              <div>Created: {issue.createdAt.toISOString().slice(0, 10)}</div>
              <div>Updated: {issue.updatedAt.toISOString().slice(0, 10)}</div>
              <div>Slug: {issue.slug}</div>
              {issue.publishedAt ? <div>Published: {issue.publishedAt.toISOString().slice(0, 10)}</div> : null}
            </div>
          </section>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
          <h2 className="mb-3 text-base font-semibold text-ink">Timeline</h2>
          <ul className="space-y-2">
            {issue.timelineEvents.map((event) => (
              <li key={event.id} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-ink">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {event.phase} · {event.label}
                </div>
                {event.detail}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/5 bg-panel/80 p-5 shadow-glow">
          <h2 className="mb-3 text-base font-semibold text-ink">Reactions</h2>
          <ul className="space-y-2">
            {issue.reactions.map((reaction) => (
              <li key={reaction.id} className="rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-ink">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {reaction.emotionType} · intensity {reaction.intensity}
                </div>
                {reaction.text}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

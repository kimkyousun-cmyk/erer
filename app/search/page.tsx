import type { Metadata } from "next";
import Link from "next/link";
import { IssueCard } from "@/components/IssueCard";
import SearchQueryTracker from "@/components/SearchQueryTracker";
import { SearchService } from "@/services/search/searchService";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search | Emotion Radar",
  description: "Find issues by mood, tag, and emotional summary.",
  robots: {
    index: true,
    follow: true
  }
};

type SearchPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toUrlSearchParams(input?: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  if (!input) return params;
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = toUrlSearchParams(searchParams);
  const result = await SearchService.search(params);

  const query = result?.query ?? params.get("q")?.trim() ?? "";
  const sort = result?.sort ?? (params.get("sort") as "relevance" | "trending" | "new" | null) ?? "relevance";

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/5 bg-panel/70 p-6 shadow-glow">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Search the Mood Radar</h1>
          <Link href="/" className="text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink">
            Back home
          </Link>
        </div>
        <p className="mb-5 max-w-3xl text-sm leading-6 text-muted">
          Search across issue titles, context summaries, verdict lines, and tags. Results blend text relevance with current emotional momentum.
        </p>

        <form action="/search" method="get" className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="sr-only" htmlFor="q">
            Search query
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Try: AI grading, rent freezes, creator bans"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ink outline-none transition focus:border-white/20 focus:bg-white/10"
          />

          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-ink outline-none transition focus:border-white/20 focus:bg-white/10"
          >
            <option value="relevance">Relevance</option>
            <option value="trending">Trending</option>
            <option value="new">New</option>
          </select>

          <button
            type="submit"
            className="rounded-2xl border border-violet-300/40 bg-violet-500/20 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-violet-100 transition hover:border-violet-200/60"
          >
            Search
          </button>
        </form>
      </section>

      {result ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              {result.issues.length > 0 ? `${result.issues.length} results` : "No results yet"}
            </div>
            <div className="text-xs text-muted">Sort: {result.sort}</div>
          </div>

          <SearchQueryTracker query={result.query} resultCount={result.issues.length} />

          {result.issues.length === 0 ? (
            <div className="rounded-3xl border border-white/5 bg-panel/70 p-8 text-center text-sm text-muted shadow-glow">
              No matching issues yet. Try a broader phrase or explore trending topics.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {result.issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { IssueSummary } from "@/lib/types";
import type { FeedMode, FeedResult } from "@/services/feed/feedService";
import { IssueCard } from "@/components/IssueCard";
import { IssueCardSkeleton } from "@/components/IssueCardSkeleton";

const modes: Array<{ key: FeedMode; label: string }> = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "divided", label: "Most Divided" },
  { key: "funny", label: "Funniest" },
  { key: "angry", label: "Angriest" }
];

interface IssueFeedClientProps {
  initialIssues: IssueSummary[];
  initialMode: FeedMode;
  initialTag?: string | null;
  tags: string[];
  initialTake: number;
}

const pageSize = 12;

export function IssueFeedClient({ initialIssues, initialMode, initialTag, tags, initialTake }: IssueFeedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<FeedMode>(initialMode);
  const [tag, setTag] = useState<string | null>(initialTag ?? null);
  const [issues, setIssues] = useState<IssueSummary[]>(initialIssues);
  const [skip, setSkip] = useState(initialIssues.length);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialIssues.length >= initialTake);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const firstLoadRef = useRef(true);

  const tagOptions = useMemo(() => {
    const normalized = tags.map((t) => t.toLowerCase());
    return Array.from(new Set(normalized)).slice(0, 12);
  }, [tags]);

  const syncUrl = useCallback(
    (nextMode: FeedMode, nextTag: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextMode === "trending") {
        params.delete("mode");
      } else {
        params.set("mode", nextMode);
      }
      if (nextTag) {
        params.set("tag", nextTag);
      } else {
        params.delete("tag");
      }
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchFeed = useCallback(
    async ({ nextMode, nextTag, nextSkip, append }: { nextMode: FeedMode; nextTag: string | null; nextSkip: number; append: boolean }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams();
      params.set("mode", nextMode);
      params.set("take", String(append ? pageSize : initialTake));
      params.set("skip", String(nextSkip));
      if (nextTag) params.set("tag", nextTag);

      const response = await fetch(`/api/feed?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to load feed");
      }

      const json = (await response.json()) as { feed: FeedResult };
      return json.feed.issues;
    },
    [initialTake]
  );

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    setLoading(true);
    setError(null);
    setSkip(0);

    fetchFeed({ nextMode: mode, nextTag: tag, nextSkip: 0, append: false })
      .then((nextIssues) => {
        setIssues(nextIssues);
        setSkip(nextIssues.length);
        setHasMore(nextIssues.length >= initialTake);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setError("Feed failed to load. Try again.");
      })
      .finally(() => {
        setLoading(false);
      });

    syncUrl(mode, tag);
  }, [fetchFeed, initialTake, mode, syncUrl, tag]);

  const loadMore = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    setError(null);

    fetchFeed({ nextMode: mode, nextTag: tag, nextSkip: skip, append: true })
      .then((nextIssues) => {
        setIssues((prev) => [...prev, ...nextIssues]);
        setSkip((prev) => prev + nextIssues.length);
        setHasMore(nextIssues.length >= pageSize);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setError("Feed failed to load. Try again.");
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [fetchFeed, loadingMore, mode, skip, tag]);

  const showingIssues = loading ? [] : issues;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink sm:text-2xl">Trending Issues</h2>
          <p className="text-sm text-muted">Signal-first cards you can scan and share.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Live Mood
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {modes.map((modeOption) => (
          <button
            key={modeOption.key}
            type="button"
            onClick={() => {
              setMode(modeOption.key);
              setTag(null);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              mode === modeOption.key
                ? "border-violet-300/40 bg-violet-500/20 text-violet-100"
                : "border-white/10 bg-white/5 text-muted hover:border-white/20"
            }`}
          >
            {modeOption.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTag(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
            tag === null
              ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
              : "border-white/10 bg-white/5 text-muted hover:border-white/20"
          }`}
        >
          All Tags
        </button>
        {tagOptions.map((tagOption) => (
          <button
            key={tagOption}
            type="button"
            onClick={() => setTag(tagOption)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              tag === tagOption
                ? "border-sky-300/40 bg-sky-500/20 text-sky-100"
                : "border-white/10 bg-white/5 text-muted hover:border-white/20"
            }`}
          >
            {tagOption}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {showingIssues.length === 0 && loading
          ? Array.from({ length: 6 }).map((_, index) => <IssueCardSkeleton key={`skeleton-${index}`} />)
          : showingIssues.map((issue) => <IssueCard key={issue.slug} issue={issue} />)}
        {loadingMore ? Array.from({ length: 3 }).map((_, index) => <IssueCardSkeleton key={`more-${index}`} />) : null}
      </div>

      {!loading && issues.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-panel/70 p-8 text-center text-sm text-muted">
          No issues yet. Try another filter or check back soon.
        </div>
      ) : null}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={loadMore}
          disabled={!hasMore || loadingMore || loading}
          className={`rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            hasMore && !loading && !loadingMore
              ? "border-white/10 bg-white/5 text-ink hover:border-white/20"
              : "border-white/5 bg-white/5 text-muted opacity-60"
          }`}
        >
          {hasMore ? (loadingMore ? "Loading..." : "Load more") : "No more issues"}
        </button>
      </div>
    </section>
  );
}

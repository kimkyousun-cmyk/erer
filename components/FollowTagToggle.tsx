"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

let cachedTags: string[] | null = null;
let inflight: Promise<string[]> | null = null;

async function loadFollowedTags(): Promise<string[]> {
  if (cachedTags) return cachedTags;
  if (inflight) return inflight;
  inflight = fetch("/api/tags/followed", { cache: "no-store" })
    .then(async (res) => {
      const data = (await res.json()) as { tags?: string[] };
      cachedTags = Array.isArray(data.tags) ? data.tags : [];
      return cachedTags;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function normalize(tag: string) {
  return tag.trim().toLowerCase();
}

interface FollowTagToggleProps {
  tag: string;
}

export function FollowTagToggle({ tag }: FollowTagToggleProps) {
  const normalized = useMemo(() => normalize(tag), [tag]);
  const [followed, setFollowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadFollowedTags().then((tags) => {
      if (!mounted) return;
      setFollowed(tags.map(normalize).includes(normalized));
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [normalized]);

  const toggle = useCallback(async () => {
    if (!ready || loading) return;
    setLoading(true);
    try {
      const action = followed ? "unfollow" : "follow";
      const res = await fetch("/api/tags/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tag: normalized, action })
      });
      const data = (await res.json()) as { tags?: string[] };
      const tags = Array.isArray(data.tags) ? data.tags.map(normalize) : [];
      cachedTags = tags;
      setFollowed(tags.includes(normalized));
    } finally {
      setLoading(false);
    }
  }, [followed, loading, normalized, ready]);

  if (!ready) {
    return (
      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {tag}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
        followed
          ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-muted hover:border-white/20"
      } ${loading ? "opacity-70" : ""}`}
      aria-pressed={followed}
      title={followed ? "Unfollow tag" : "Follow tag"}
    >
      {tag}
    </button>
  );
}

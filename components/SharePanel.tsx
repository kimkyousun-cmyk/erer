"use client";

import { useCallback, useMemo, useState } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClient";
import { shareLinks, shareText, withUtm } from "@/lib/share";

interface SharePanelProps {
  url: string;
  title: string;
  verdict: string;
  issueId: string;
  tags?: string[];
}

const networks = [
  { key: "x", label: "X" },
  { key: "facebook", label: "Facebook" },
  { key: "threads", label: "Threads" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "reddit", label: "Reddit" },
  { key: "kakao", label: "Kakao" }
] as const;

export function SharePanel({ url, title, verdict, issueId, tags }: SharePanelProps) {
  const [message, setMessage] = useState<string>("");
  const shareUrl = useMemo(() => withUtm(url, "share-panel"), [url]);
  const links = useMemo(() => shareLinks({ url: shareUrl, title, verdict }), [shareUrl, title, verdict]);
  const summary = useMemo(() => shareText(title, verdict), [title, verdict]);

  const onCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Link copied");
      void trackClientEvent({ eventName: "SHARE_CLICK", issueId, tags, metadata: { surface: "share_panel", type: "copy" } });
    } catch {
      setMessage("Copy failed");
    }
  }, [issueId, shareUrl, tags]);

  const onCopySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setMessage("Summary copied");
      void trackClientEvent({ eventName: "SHARE_CLICK", issueId, tags, metadata: { surface: "share_panel", type: "summary" } });
    } catch {
      setMessage("Copy failed");
    }
  }, [issueId, summary, tags]);

  return (
    <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Share</h3>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Viral-ready</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {networks.map((network) => (
          <a
            key={network.key}
            href={links[network.key]}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
            onClick={() =>
              trackClientEvent({
                eventName: "SHARE_CLICK",
                issueId,
                tags,
                metadata: { surface: "share_panel", network: network.key }
              })
            }
          >
            {network.label}
          </a>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={onCopySummary}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Copy summary
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Copy link
        </button>
      </div>

      {message ? <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{message}</div> : null}
    </section>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClient";
import { shareHashtags, shareLinks, shareText, withUtm } from "@/lib/share";

interface SharePanelProps {
  url: string;
  title: string;
  verdict: string;
  issueId: string;
  tags?: string[];
  ogImageUrl?: string | null;
}

const networks = [
  { key: "x", label: "X" },
  { key: "threads", label: "Threads" },
  { key: "bluesky", label: "Bluesky" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "reddit", label: "Reddit" },
  { key: "kakao", label: "Kakao" },
  { key: "email", label: "Email" }
] as const;

export function SharePanel({ url, title, verdict, issueId, tags, ogImageUrl }: SharePanelProps) {
  const [message, setMessage] = useState<string>("");
  const shareUrl = useMemo(() => withUtm(url, "share-panel"), [url]);
  const links = useMemo(() => shareLinks({ url: shareUrl, title, verdict, tags }), [shareUrl, title, verdict, tags]);
  const summary = useMemo(() => shareText(title, verdict), [title, verdict]);
  const hashtags = useMemo(() => shareHashtags(tags), [tags]);
  const postText = useMemo(() => [summary, hashtags.join(" "), shareUrl].filter(Boolean).join(" \n\n"), [summary, hashtags, shareUrl]);

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
      await navigator.clipboard.writeText(postText);
      setMessage("Post copied");
      void trackClientEvent({ eventName: "SHARE_CLICK", issueId, tags, metadata: { surface: "share_panel", type: "summary" } });
    } catch {
      setMessage("Copy failed");
    }
  }, [issueId, postText, tags]);

  const onNativeShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: summary, url: shareUrl });
        setMessage("Shared");
        void trackClientEvent({ eventName: "SHARE_CLICK", issueId, tags, metadata: { surface: "share_panel", type: "native" } });
      }
    } catch {
      setMessage("Share failed");
    }
  }, [issueId, shareUrl, summary, tags, title]);

  const onCopyHashtags = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hashtags.join(" "));
      setMessage("Hashtags copied");
      void trackClientEvent({ eventName: "SHARE_CLICK", issueId, tags, metadata: { surface: "share_panel", type: "hashtags" } });
    } catch {
      setMessage("Copy failed");
    }
  }, [hashtags, issueId, tags]);

  const onDownloadImage = useCallback(() => {
    if (!ogImageUrl) return;
    trackClientEvent({ eventName: "SHARE_CLICK", issueId, tags, metadata: { surface: "share_panel", type: "image" } });
  }, [issueId, ogImageUrl, tags]);

  return (
    <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Share</h3>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Viral-ready</div>
      </div>

      {typeof navigator !== "undefined" && navigator.share ? (
        <button
          type="button"
          onClick={onNativeShare}
          className="mb-3 w-full rounded-2xl border border-violet-300/40 bg-violet-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 transition hover:border-violet-200/60"
        >
          Share sheet
        </button>
      ) : null}

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
          Copy post
        </button>
        <button
          type="button"
          onClick={onCopyHashtags}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Copy hashtags
        </button>
        <button
          type="button"
          onClick={onCopyLink}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Copy link
        </button>
        {ogImageUrl ? (
          <a
            href={ogImageUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onDownloadImage}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
          >
            Open share image
          </a>
        ) : null}
      </div>

      {message ? <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{message}</div> : null}
    </section>
  );
}

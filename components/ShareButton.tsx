"use client";

import { useCallback, useState } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClient";

interface ShareButtonProps {
  url: string;
  label: string;
  issueId: string;
  tags?: string[];
}

export function ShareButton({ url, label, issueId, tags }: ShareButtonProps) {
  const [message, setMessage] = useState("");

  const onShare = useCallback(async () => {
    setMessage("");
    try {
      if (navigator.share) {
        await navigator.share({ url });
        setMessage("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied");
      }

      void trackClientEvent({
        eventName: "SHARE_CLICK",
        issueId,
        tags,
        metadata: { surface: "issue_header" }
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Share failed");
    }
  }, [issueId, tags, url]);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onShare}
        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
      >
        {label}
      </button>
      {message ? <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{message}</div> : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { trackClientEvent, type TrackClientEvent } from "@/lib/analytics/trackClient";

export function useTrackEvent(base?: Omit<TrackClientEvent, "eventName">) {
  const stableBase = useMemo(() => base, [base]);

  return useCallback(
    (event: TrackClientEvent) => {
      const merged: TrackClientEvent = {
        ...stableBase,
        ...event
      };
      void trackClientEvent(merged);
    },
    [stableBase]
  );
}

export function useTrackIssueOpen(issueId: string, tags?: string[]) {
  const track = useTrackEvent({ issueId, tags });
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    track({ eventName: "ISSUE_OPEN" });
  }, [track]);
}

export function useTrackScrollDepth(issueId: string, tags?: string[]) {
  const track = useTrackEvent({ issueId, tags });
  const tracked25 = useRef(false);
  const tracked75 = useRef(false);

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      if (scrollHeight <= 0) {
        return;
      }

      const percent = (scrollTop / scrollHeight) * 100;

      if (!tracked25.current && percent >= 25) {
        tracked25.current = true;
        track({ eventName: "ISSUE_SCROLL_25" });
      }

      if (!tracked75.current && percent >= 75) {
        tracked75.current = true;
        track({ eventName: "ISSUE_SCROLL_75" });
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [track]);
}

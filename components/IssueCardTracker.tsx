"use client";

import { useEffect, useRef } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClient";

interface IssueCardTrackerProps {
  issueId: string;
  tags?: string[];
}

export default function IssueCardTracker({ issueId, tags }: IssueCardTrackerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || tracked.current || !entry.isIntersecting) return;
        tracked.current = true;
        void trackClientEvent({ eventName: "ISSUE_CARD_VIEW", issueId, tags });
        observer.disconnect();
      },
      {
        threshold: 0.4
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [issueId, tags]);

  return <div ref={ref} className="sr-only" aria-hidden="true" />;
}

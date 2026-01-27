"use client";

import { useEffect, useRef } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClient";

interface SearchQueryTrackerProps {
  query: string;
  resultCount: number;
}

export default function SearchQueryTracker({ query, resultCount }: SearchQueryTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    const tokens = query.split(" ").filter(Boolean);
    void trackClientEvent({
      eventName: "SEARCH_QUERY",
      metadata: {
        length: query.length,
        tokens: tokens.length,
        results: resultCount
      }
    });
  }, [query, resultCount]);

  return null;
}

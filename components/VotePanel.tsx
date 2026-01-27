"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmotionScores, IssueDetail } from "@/lib/types";

interface VotePanelProps {
  slug: string;
  initialPulse: IssueDetail["communityPulse"];
  onAdjustedScores?: (scores: EmotionScores) => void;
  onPulse?: (pulse: IssueDetail["communityPulse"]) => void;
}

type VoteChoice = { agree: boolean; justified: boolean } | null;

const STORAGE_PREFIX = "emotion-radar:votes:";

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

export function VotePanel({ slug, initialPulse, onAdjustedScores, onPulse }: VotePanelProps) {
  const [pulse, setPulse] = useState(initialPulse);
  const [choice, setChoice] = useState<VoteChoice>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const timerRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(storageKey(slug));
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as VoteChoice;
      setChoice(parsed);
      setStatus(parsed ? "done" : "idle");
    } catch {
      // Ignore corrupted session votes.
    }
  }, [slug]);

  useEffect(() => {
    onPulse?.(pulse);
  }, [onPulse, pulse]);

  const total = useMemo(() => pulse.agree + pulse.disagree, [pulse]);
  const agreePct = total === 0 ? 50 : Math.round((pulse.agree / total) * 100);

  const submitVote = useCallback(
    (nextChoice: Exclude<VoteChoice, null>) => {
      setChoice(nextChoice);
      sessionStorage.setItem(storageKey(slug), JSON.stringify(nextChoice));
      setStatus("sending");

      if (timerRef.current) window.clearTimeout(timerRef.current);
      controllerRef.current?.abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      timerRef.current = window.setTimeout(async () => {
        try {
          const res = await fetch("/api/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, ...nextChoice }),
            signal: controller.signal
          });

          if (!res.ok) throw new Error("Vote failed");
          const data = (await res.json()) as {
            communityPulse: IssueDetail["communityPulse"];
            adjustedScores: EmotionScores;
          };

          setPulse(data.communityPulse);
          onAdjustedScores?.(data.adjustedScores);
          setStatus("done");
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          setStatus("error");
        }
      }, 420);
    },
    [onAdjustedScores, slug]
  );

  const disabled = status === "sending";

  return (
    <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Community Pulse</h3>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          Agree {agreePct}%
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => submitVote({ agree: true, justified: choice?.justified ?? true })}
          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
            choice?.agree === true
              ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
              : "border-white/10 bg-white/5 text-ink hover:border-white/20"
          } ${disabled ? "opacity-60" : ""}`}
        >
          Agree
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => submitVote({ agree: false, justified: choice?.justified ?? false })}
          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
            choice?.agree === false
              ? "border-rose-300/40 bg-rose-400/15 text-rose-100"
              : "border-white/10 bg-white/5 text-ink hover:border-white/20"
          } ${disabled ? "opacity-60" : ""}`}
        >
          Disagree
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => submitVote({ agree: choice?.agree ?? true, justified: false })}
          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
            choice?.justified === false
              ? "border-amber-300/40 bg-amber-400/15 text-amber-100"
              : "border-white/10 bg-white/5 text-ink hover:border-white/20"
          } ${disabled ? "opacity-60" : ""}`}
        >
          Overreaction
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => submitVote({ agree: choice?.agree ?? true, justified: true })}
          className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
            choice?.justified === true
              ? "border-sky-300/40 bg-sky-400/15 text-sky-100"
              : "border-white/10 bg-white/5 text-ink hover:border-white/20"
          } ${disabled ? "opacity-60" : ""}`}
        >
          Justified
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted">
        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
          <div className="font-semibold text-ink">Agree</div>
          <div>{pulse.agree}</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
          <div className="font-semibold text-ink">Disagree</div>
          <div>{pulse.disagree}</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
          <div className="font-semibold text-ink">Overreaction</div>
          <div>{pulse.overreaction}</div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
          <div className="font-semibold text-ink">Justified</div>
          <div>{pulse.justified}</div>
        </div>
      </div>

      {status === "error" ? (
        <p className="mt-3 text-xs font-semibold text-rose-300">Network hiccup. Try again.</p>
      ) : null}
      {status === "done" ? (
        <p className="mt-3 text-xs font-semibold text-emerald-300">Vote recorded for this session.</p>
      ) : null}
    </section>
  );
}

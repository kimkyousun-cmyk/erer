"use client";

import { useCallback, useMemo, useState } from "react";
import { trackClientEvent } from "@/lib/analytics/trackClient";

type FeedbackType = "CONFUSING" | "BIASED" | "LOW_QUALITY" | "REPETITIVE" | "GREAT";

type SubmitState = "idle" | "submitting" | "done" | "error";

interface FeedbackPanelProps {
  issueId: string;
  tags?: string[];
}

const feedbackOptions: Array<{ type: FeedbackType; label: string; tone: string }> = [
  { type: "CONFUSING", label: "Confusing", tone: "border-white/15 bg-white/5 text-ink" },
  { type: "BIASED", label: "Feels biased", tone: "border-amber-300/40 bg-amber-400/10 text-amber-100" },
  { type: "LOW_QUALITY", label: "Low quality", tone: "border-rose-300/40 bg-rose-400/10 text-rose-100" },
  { type: "REPETITIVE", label: "Repetitive", tone: "border-violet-300/40 bg-violet-500/10 text-violet-100" },
  { type: "GREAT", label: "This is great", tone: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100" }
];

export function FeedbackPanel({ issueId, tags }: FeedbackPanelProps) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<FeedbackType | null>(null);

  const canSubmit = useMemo(() => state !== "submitting", [state]);

  const submit = useCallback(
    async (type: FeedbackType) => {
      if (!canSubmit) return;
      setSelected(type);
      setState("submitting");
      setMessage("");

      try {
        const res = await fetch(`/api/issues/${issueId}/feedback`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, note: note.trim() || undefined })
        });

        if (!res.ok) {
          throw new Error("Feedback request failed");
        }

        setState("done");
        setMessage("Thanks — this helps improve future summaries.");

        void trackClientEvent({
          eventName: "ISSUE_FEEDBACK",
          issueId,
          tags,
          metadata: { type }
        });
      } catch (err) {
        setState("error");
        setMessage(err instanceof Error ? err.message : "Failed to submit feedback");
      }
    },
    [canSubmit, issueId, note, tags]
  );

  return (
    <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Feedback</h3>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Improve</div>
      </div>

      <p className="mb-3 text-xs leading-5 text-muted">
        Reactions are simulated. If this summary misses the vibe, tell us why.
      </p>

      <div className="mb-3 grid grid-cols-1 gap-2">
        {feedbackOptions.map((option) => (
          <button
            key={option.type}
            type="button"
            disabled={!canSubmit}
            onClick={() => submit(option.type)}
            className={`rounded-2xl border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition hover:border-white/25 ${option.tone} ${selected === option.type ? "ring-1 ring-white/20" : ""} ${!canSubmit ? "opacity-70" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-muted" htmlFor={`feedback-note-${issueId}`}>
        Optional note
      </label>
      <textarea
        id={`feedback-note-${issueId}`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        placeholder="What felt off? Keep it short."
        className="min-h-[80px] w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-ink outline-none focus:border-white/20"
      />

      {state === "submitting" ? <div className="mt-2 text-xs font-semibold text-muted">Submitting…</div> : null}
      {message ? (
        <div
          className={`mt-3 rounded-2xl border px-3 py-2 text-xs font-semibold ${
            state === "done"
              ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
              : state === "error"
                ? "border-rose-300/40 bg-rose-400/10 text-rose-100"
                : "border-white/10 bg-white/5 text-ink"
          }`}
        >
          {message}
        </div>
      ) : null}
    </section>
  );
}

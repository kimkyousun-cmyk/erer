"use client";

import { useCallback, useMemo, useState } from "react";
import type { ShortsPackage } from "@/lib/validation/shorts";
import { trackClientEvent } from "@/lib/analytics/trackClient";

interface CreatorToolsPanelProps {
  issueId: string;
  slug: string;
  tags?: string[];
  shortsStatus?: {
    status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
    resultVideoUrl?: string | null;
    updatedAt?: string | null;
    externalRunId?: string | null;
  } | null;
}

type LoadState = "idle" | "loading" | "ready" | "error";

export function CreatorToolsPanel({ issueId, slug, tags, shortsStatus }: CreatorToolsPanelProps) {
  const [pkg, setPkg] = useState<ShortsPackage | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState<string>("");

  const ensurePackage = useCallback(async () => {
    if (pkg) return pkg;
    setState("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/issues/${issueId}/shorts-package`, {
        method: "GET",
        cache: "no-store"
      });
      const data = (await res.json()) as { ok?: boolean; package?: ShortsPackage; error?: string };
      if (!res.ok || !data.package) {
        throw new Error(data.error ?? "Failed to load shorts package");
      }
      setPkg(data.package);
      setState("ready");
      return data.package;
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Failed to load package");
      throw err;
    }
  }, [issueId, pkg]);

  const copy = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied`);
    } catch {
      setMessage(`Failed to copy ${label}`);
    }
  }, []);

  const scriptText = useMemo(() => pkg?.script.full_text ?? "", [pkg]);
  const scenesText = useMemo(
    () => pkg?.image_prompts.map((p) => `${p.frame_number}. ${p.scene_description}`).join("\n") ?? "",
    [pkg]
  );
  const hashtagsText = useMemo(() => pkg?.metadata.hashtags.join(" ") ?? "", [pkg]);
  const thumbnailText = useMemo(() => pkg?.metadata.thumbnail_text.join(" / ") ?? "", [pkg]);

  const exportJson = useCallback(async () => {
    const loaded = await ensurePackage();
    await copy(JSON.stringify(loaded, null, 2), "Shorts JSON");
    void trackClientEvent({
      eventName: "EXPORT_CLICK",
      issueId,
      tags,
      metadata: { action: "export_json" }
    });
  }, [copy, ensurePackage, issueId, tags]);

  const exportScript = useCallback(async () => {
    const loaded = await ensurePackage();
    await copy(loaded.script.full_text, "Script");
    void trackClientEvent({
      eventName: "EXPORT_CLICK",
      issueId,
      tags,
      metadata: { action: "export_script" }
    });
  }, [copy, ensurePackage, issueId, tags]);

  const exportScenes = useCallback(async () => {
    const loaded = await ensurePackage();
    const text = loaded.image_prompts
      .map((p) => `${p.frame_number}. ${p.scene_description}\n${p.prompt}`)
      .join("\n\n");
    await copy(text, "Scene prompts");
    void trackClientEvent({
      eventName: "EXPORT_CLICK",
      issueId,
      tags,
      metadata: { action: "export_scenes" }
    });
  }, [copy, ensurePackage, issueId, tags]);

  const exportHashtags = useCallback(async () => {
    const loaded = await ensurePackage();
    await copy(loaded.metadata.hashtags.join(" "), "Hashtags");
    void trackClientEvent({
      eventName: "EXPORT_CLICK",
      issueId,
      tags,
      metadata: { action: "export_hashtags" }
    });
  }, [copy, ensurePackage, issueId, tags]);

  const exportThumbnail = useCallback(async () => {
    const loaded = await ensurePackage();
    await copy(loaded.metadata.thumbnail_text.join(" / "), "Thumbnail text");
    void trackClientEvent({
      eventName: "EXPORT_CLICK",
      issueId,
      tags,
      metadata: { action: "export_thumbnail" }
    });
  }, [copy, ensurePackage, issueId, tags]);

  const sendToN8n = useCallback(async () => {
    setMessage("");
    setState("loading");
    try {
      const res = await fetch("/api/shorts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId })
      });
      const data = (await res.json()) as { ok?: boolean; jobId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setMessage(`Sent to n8n (job ${data.jobId ?? "created"})`);
      setState("ready");
      void trackClientEvent({
        eventName: "EXPORT_CLICK",
        issueId,
        tags,
        metadata: { action: "send_to_n8n" }
      });
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Send failed");
    }
  }, [issueId, tags]);

  const statusTone = shortsStatus?.status === "SUCCEEDED" ? "text-emerald-100" : shortsStatus?.status === "FAILED" ? "text-rose-100" : "text-amber-100";

  return (
    <section className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Creator Tools</h3>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Shorts</div>
      </div>

      {shortsStatus ? (
        <div className="mb-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-xs text-muted">
          <div className={`font-semibold uppercase tracking-wide ${statusTone}`}>Status: {shortsStatus.status}</div>
          {shortsStatus.resultVideoUrl ? (
            <a href={shortsStatus.resultVideoUrl} className="mt-1 inline-block text-ink underline" target="_blank" rel="noreferrer">
              Open last render
            </a>
          ) : null}
          {shortsStatus.externalRunId ? <div className="mt-1">Run: {shortsStatus.externalRunId}</div> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={exportJson}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={exportScript}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Script
        </button>
        <button
          type="button"
          onClick={exportScenes}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Scenes
        </button>
        <button
          type="button"
          onClick={exportThumbnail}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Thumbnail
        </button>
        <button
          type="button"
          onClick={exportHashtags}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition hover:border-white/20"
        >
          Hashtags
        </button>
        <button
          type="button"
          onClick={sendToN8n}
          className="rounded-2xl border border-violet-300/40 bg-violet-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-100 transition hover:border-violet-200/60"
        >
          Send to n8n
        </button>
      </div>

      {state === "loading" ? (
        <div className="mt-3 text-xs font-semibold text-muted">Working...</div>
      ) : null}

      {message ? (
        <div className="mt-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-xs font-semibold text-ink">{message}</div>
      ) : null}

      {pkg ? (
        <div className="mt-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-[11px] text-muted">
          <div className="mb-1 font-semibold uppercase tracking-wide text-ink">Preview</div>
          <div className="mb-1">Title: {pkg.title}</div>
          <div className="mb-1">Hook: {pkg.hook_text}</div>
          <div>{scriptText}</div>
        </div>
      ) : null}

      <div className="mt-3 text-[11px] uppercase tracking-wide text-muted">/issue/{slug}</div>
    </section>
  );
}

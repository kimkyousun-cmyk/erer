import type { Metadata } from "next";
import { FeedService } from "@/services/feed/feedService";
import type { FeedMode } from "@/services/feed/feedService";
import { IssueFeedClient } from "@/components/IssueFeedClient";
import { FeedRepo } from "@/repositories/feedRepo";
import { getSessionHash } from "@/lib/security/session";
import { IssueCard } from "@/components/IssueCard";

export const metadata: Metadata = {
  title: "Emotion Radar — Trending Mood",
  description:
    "Trending internet issues summarized emotionally: anger, humor, and division in one glance."
};

interface HomePageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const modeParam = readParam(searchParams?.mode);
  const tagParam = readParam(searchParams?.tag);
  const allowedModes: FeedMode[] = ["trending", "new", "divided", "funny", "angry", "for_you", "following"];
  const parsedMode = allowedModes.includes(modeParam as FeedMode) ? (modeParam as FeedMode) : "trending";
  const mode = parsedMode ?? "trending";
  const take = 24;

  const params = new URLSearchParams({ mode, take: String(take), skip: "0" });
  if (tagParam) params.set("tag", tagParam);

  const sessionHash = getSessionHash();
  const [feed, followedTags] = await Promise.all([
    FeedService.getFeed(params),
    FeedRepo.listSessionFollowTags(sessionHash)
  ]);

  const tags = Array.from(new Set(feed.issues.flatMap((issue) => issue.tags))).slice(0, 12);
  const hasFollowed = followedTags.length > 0;
  const followingFeed = hasFollowed
    ? await FeedService.getFeed(new URLSearchParams({ mode: "following", take: "6", skip: "0" }))
    : null;

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Emotion &gt; Information
            </p>
            <h1 className="mb-4 text-3xl font-semibold leading-[1.05] text-ink sm:text-5xl">
              Feel the Internet
              <span className="block text-muted">before it explains itself.</span>
            </h1>
            <p className="text-base leading-7 text-muted">
              Emotion Radar is a public sentiment visualization engine. It does not tell you the facts.
              It shows the mood: who is mad, who is laughing, and where the split lives.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/5 bg-white/5 p-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-red-100">
              Anger
            </div>
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-amber-100">
              Humor
            </div>
            <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-violet-100">
              Division
            </div>
          </div>
        </div>
      </section>

      {hasFollowed && followingFeed ? (
        <section className="rounded-3xl border border-white/5 bg-panel/70 p-6 shadow-glow">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">Following</h2>
              <p className="text-sm text-muted">Issues from tags you care about.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {followedTags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {followingFeed.issues.map((issue) => (
              <IssueCard key={issue.slug} issue={issue} />
            ))}
          </div>
        </section>
      ) : null}

      <IssueFeedClient
        initialIssues={feed.issues}
        initialMode={feed.mode}
        initialTag={tagParam ?? null}
        tags={tags}
        initialTake={take}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Speed</div>
          <h3 className="mb-2 text-lg font-semibold text-ink">Mood in Seconds</h3>
          <p className="text-sm leading-6 text-muted">
            We optimize for the first 10 seconds: emotional clarity beats exhaustive coverage.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Signal</div>
          <h3 className="mb-2 text-lg font-semibold text-ink">Opinionated by Design</h3>
          <p className="text-sm leading-6 text-muted">
            Ambiguity is allowed if it feels truthful. We highlight the energy, not the receipts.
          </p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-panel/70 p-5 shadow-glow">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Share</div>
          <h3 className="mb-2 text-lg font-semibold text-ink">Cards That Travel</h3>
          <p className="text-sm leading-6 text-muted">
            Each card is built to screenshot cleanly on mobile and hold up out of context.
          </p>
        </div>
      </section>
    </main>
  );
}

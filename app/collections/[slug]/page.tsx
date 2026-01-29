import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { issueCollections } from "@/data/collections";
import { IssueRepo } from "@/repositories/issueRepo";
import { toIssueSummary } from "@/services/issues/issueMapper";
import { IssueCard } from "@/components/IssueCard";

interface CollectionPageProps {
  params: { slug: string };
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const collection = issueCollections.find((item) => item.slug === params.slug);
  if (!collection) {
    return { title: "Collection Not Found" };
  }

  return {
    title: `${collection.title} · Emotion Radar`,
    description: collection.description
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = issueCollections.find((item) => item.slug === params.slug);
  if (!collection) notFound();

  const issues = await IssueRepo.list({ status: "PUBLISHED", take: 80, skip: 0 });
  const matches = issues.filter((issue) => {
    const issueTags = parseTags(issue.tags);
    return collection.tags.some((tag) => issueTags.includes(tag.toLowerCase()));
  });

  const summaries = await Promise.all(matches.map((issue) => toIssueSummary(issue)));

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Collection</p>
        <h1 className="text-3xl font-semibold text-ink sm:text-5xl">{collection.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{collection.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {collection.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {summaries.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-panel/70 p-8 text-center text-sm text-muted">
          No issues found in this collection yet.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaries.map((issue) => (
            <IssueCard key={issue.slug} issue={issue} />
          ))}
        </section>
      )}
    </main>
  );
}

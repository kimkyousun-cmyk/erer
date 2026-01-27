import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssueDetailClient } from "@/components/IssueDetailClient";
import { getAllSlugs, getIssueDetail } from "@/services/issueGenerator";

interface IssuePageProps {
  params: { slug: string };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1ba5bb33.menu-piker.pages.dev";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: IssuePageProps): Metadata {
  const issue = getIssueDetail(params.slug);
  if (!issue) {
    return {
      title: "Issue Not Found"
    };
  }

  const url = `${siteUrl}/issue/${issue.slug}`;
  const description = `${issue.verdict.label} — Anger ${issue.scores.anger}, Humor ${issue.scores.humor}, Division ${issue.scores.division}.`;

  return {
    title: issue.title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: `${issue.title} · Emotion Radar`,
      description,
      url,
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: `${issue.title} · Emotion Radar`,
      description
    }
  };
}

export default function IssuePage({ params }: IssuePageProps) {
  const issue = getIssueDetail(params.slug);
  if (!issue) notFound();

  return (
    <main className="space-y-6">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          {issue.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="mb-3 max-w-4xl text-3xl font-semibold leading-[1.05] text-ink sm:text-5xl">
          {issue.title}
        </h1>
        <p className="mb-4 max-w-3xl text-base leading-7 text-muted">{issue.context}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Trigger</div>
            <p className="text-sm leading-6 text-ink">{issue.trigger}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Verdict</div>
            <p className="text-sm leading-6 text-ink">{issue.verdict.label}</p>
          </div>
        </div>
      </header>

      <IssueDetailClient issue={issue} />
    </main>
  );
}

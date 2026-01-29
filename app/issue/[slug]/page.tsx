import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssueDetailClient } from "@/components/IssueDetailClient";
import { getAllSlugs } from "@/services/issueGenerator";
import { IssueService } from "@/services/issues/issueService";
import { ExperimentService } from "@/services/experiments/experimentService";
import { ShareButton } from "@/components/ShareButton";
import { FollowTagToggle } from "@/components/FollowTagToggle";

interface IssuePageProps {
  params: { slug: string };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://1ba5bb33.menu-piker.pages.dev";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
  const issue = await IssueService.getIssueDetailBySlug(params.slug);
  if (!issue) {
    return {
      title: "Issue Not Found"
    };
  }

  const url = `${siteUrl}/issue/${issue.slug}`;
  const ogImage = `${siteUrl}/issue/${issue.slug}/opengraph-image`;
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
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: issue.title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${issue.title} · Emotion Radar`,
      description,
      images: [ogImage]
    }
  };
}

export default async function IssuePage({ params }: IssuePageProps) {
  const issue = await IssueService.getIssueDetailBySlug(params.slug);
  if (!issue) notFound();

  const shareVariant = await ExperimentService.getVariant("SHARE_CTA_COPY");
  const shareLabel =
    shareVariant.variant === "punchy"
      ? "Share Card"
      : shareVariant.variant === "discuss"
        ? "Share Vibe"
        : "Share";
  const issueUrl = `${siteUrl}/issue/${issue.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: issue.title,
    description: issue.context,
    mainEntityOfPage: issueUrl,
    datePublished: issue.publishedAt ?? issue.updatedAt,
    dateModified: issue.updatedAt,
    author: {
      "@type": "Organization",
      name: "Emotion Radar"
    },
    publisher: {
      "@type": "Organization",
      name: "Emotion Radar"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: issue.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <main className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {issue.tags.map((tag) => (
              <FollowTagToggle key={tag} tag={tag} />
            ))}
          </div>
          <ShareButton url={issueUrl} label={shareLabel} issueId={issue.id} tags={issue.tags} />
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

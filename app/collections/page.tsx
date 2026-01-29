import type { Metadata } from "next";
import Link from "next/link";
import { issueCollections } from "@/data/collections";

export const metadata: Metadata = {
  title: "Collections · Emotion Radar",
  description: "Curated clusters of issues by theme and emotional gravity."
};

export default function CollectionsPage() {
  return (
    <main className="space-y-8">
      <header className="rounded-3xl border border-white/5 bg-panel/80 p-6 shadow-glow sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Collections</p>
        <h1 className="text-3xl font-semibold text-ink sm:text-5xl">Curated Mood Clusters</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          These bundles map recurring emotional themes across issues. They are not categories — they are moods that
          reappear.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {issueCollections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/collections/${collection.slug}`}
            className="group rounded-3xl border border-white/5 bg-panel/70 p-6 shadow-glow transition hover:-translate-y-0.5 hover:border-white/10"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Collection</div>
            <h2 className="mb-2 text-xl font-semibold text-ink">{collection.title}</h2>
            <p className="mb-4 text-sm leading-6 text-muted">{collection.description}</p>
            <div className="flex flex-wrap gap-2">
              {collection.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

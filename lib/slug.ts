export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

export async function ensureUniqueSlug(base: string) {
  const root = slugify(base) || "issue";

  const { prisma } = await import("@/lib/db/prisma");
  const existing = await prisma.issue.findMany({
    where: {
      slug: {
        startsWith: root
      }
    },
    select: { slug: true }
  });

  if (!existing.some((e) => e.slug === root)) return root;

  let counter = 2;
  while (counter < 2000) {
    const candidate = `${root}-${counter}`;
    if (!existing.some((e) => e.slug === candidate)) return candidate;
    counter += 1;
  }

  // Extremely defensive fallback.
  return `${root}-${Date.now()}`;
}

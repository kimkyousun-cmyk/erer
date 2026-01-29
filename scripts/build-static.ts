import { mkdir, rm, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { listIssues, getIssueDetail } from "../services/issueGenerator";
import { issueCollections } from "../data/collections";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
const outDir = path.join(process.cwd(), "dist");
const assetsDir = path.join(outDir, "assets");

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(data: unknown) {
  return JSON.stringify(data).replace(/<\//g, "<\\/");
}

function layout(title: string, description: string, body: string, extraHead = "") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="icon" href="/favicon.ico" />
  <link rel="stylesheet" href="/assets/style.css" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:image" content="${siteUrl}/og-image.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  ${extraHead}
</head>
<body>
  <header class="topbar">
    <a href="/" class="logo">Emotion Radar</a>
    <nav class="nav">
      <a href="/collections">Collections</a>
      <a href="/daily">Daily</a>
      <a href="/search">Search</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <main class="container">
    ${body}
  </main>
  <footer class="footer">
    <div>Emotion Radar — emotion-first sentiment snapshots.</div>
    <div><a href="/about">About</a> · <a href="/sitemap.xml">Sitemap</a></div>
  </footer>
  <script src="/assets/app.js" defer></script>
</body>
</html>`;
}

function emotionBars(scores: { anger: number; humor: number; division: number }) {
  return `
    <div class="bars">
      <div><span>Anger</span><div class="bar"><div style="width:${scores.anger}%" class="bar-anger"></div></div></div>
      <div><span>Humor</span><div class="bar"><div style="width:${scores.humor}%" class="bar-humor"></div></div></div>
      <div><span>Division</span><div class="bar"><div style="width:${scores.division}%" class="bar-division"></div></div></div>
    </div>`;
}

function issueCard(issue: ReturnType<typeof listIssues>[number]) {
  return `
  <a class="card" href="/issue/${issue.slug}/" data-tags="${issue.tags.join(",")}">
    <div class="card-tags">${issue.tags
      .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
      .join(" ")}</div>
    <h3>${escapeHtml(issue.title)}</h3>
    <p>${escapeHtml(issue.context)}</p>
    ${emotionBars(issue.scores)}
    <div class="verdict">${escapeHtml(issue.verdict.label)}</div>
  </a>`;
}

function renderHome() {
  const issues = listIssues();
  const top = issues.slice(0, 3);
  const tags = Array.from(new Set(issues.flatMap((i) => i.tags))).slice(0, 10);

  const webSiteJson = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Emotion Radar",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const body = `
  <section class="hero">
    <div>
      <div class="eyebrow">Emotion &gt; Information</div>
      <h1>Feel the Internet <span>before it explains itself.</span></h1>
      <p>Emotion Radar shows the mood: who is mad, who is laughing, and where the split lives.</p>
      <div class="hero-actions">
        <a class="button" href="/search">Explore moods</a>
        <a class="button ghost" href="/collections">Browse collections</a>
      </div>
    </div>
    <div class="pill-grid">
      <span>Anger</span>
      <span>Humor</span>
      <span>Division</span>
    </div>
  </section>

  <section class="panel">
    <h2>Quick Answer</h2>
    <p>Emotion Radar is a public sentiment visualization engine. It shows how the internet feels, not just the facts.</p>
    <div class="grid">${top.map(issueCard).join("\n")}</div>
  </section>

  <section class="panel">
    <h2>Hot Tags</h2>
    <div class="tag-cloud">${tags.map((tag) => `<a class="tag" href="/search?tag=${tag}">${escapeHtml(tag)}</a>`).join(" ")}</div>
  </section>

  <section>
    <h2>Trending Issues</h2>
    <div class="grid">${issues.map(issueCard).join("\n")}</div>
  </section>
  `;

  const extraHead = `<script type="application/ld+json">${safeJson(webSiteJson)}</script>`;

  return layout(
    "Emotion Radar — Feel the Internet",
    "Trending internet issues summarized emotionally: anger, humor, and division.",
    body,
    extraHead
  );
}

function renderIssue(slug: string) {
  const issue = getIssueDetail(slug);
  if (!issue) return layout("Issue not found", "Issue not found", "<p>Issue not found.</p>");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: issue.title,
    description: issue.context,
    mainEntityOfPage: `${siteUrl}/issue/${issue.slug}/`,
    datePublished: issue.publishedAt ?? issue.updatedAt,
    dateModified: issue.updatedAt,
    author: { "@type": "Organization", name: "Emotion Radar" },
    publisher: { "@type": "Organization", name: "Emotion Radar" }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: issue.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  const extraHead = `
  <meta property="og:title" content="${escapeHtml(issue.title)}" />
  <meta property="og:description" content="${escapeHtml(issue.context)}" />
  <meta property="og:image" content="${siteUrl}/issue/${issue.slug}/opengraph-image" />
  <script type="application/ld+json">${safeJson(jsonLd)}</script>
  <script type="application/ld+json">${safeJson(faqJsonLd)}</script>
  `;

  const shareUrl = `${siteUrl}/issue/${issue.slug}/`;

  const body = `
  <section class="issue-header">
    <div class="card-tags">${issue.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(" ")}</div>
    <h1>${escapeHtml(issue.title)}</h1>
    <p>${escapeHtml(issue.context)}</p>
    <div class="grid-two">
      <div class="panel"><strong>Trigger</strong><p>${escapeHtml(issue.trigger)}</p></div>
      <div class="panel"><strong>Verdict</strong><p>${escapeHtml(issue.verdict.label)}</p></div>
    </div>
  </section>

  <section class="panel">
    <h2>Answer in 10 seconds</h2>
    <ul>${issue.quickSummary.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  </section>

  <section class="panel">
    <h2>Emotional Overview</h2>
    ${emotionBars(issue.scores)}
  </section>

  <section class="panel">
    <h2>Timeline</h2>
    <ul>${issue.timeline
      .map((phase) => `<li><strong>${escapeHtml(phase.label)}</strong> — ${escapeHtml(phase.summary)}</li>`)
      .join("")}</ul>
  </section>

  <section class="panel">
    <h2>Reactions (synthetic)</h2>
    <div class="grid">${issue.reactions.map((r) => `<div class="reaction">${escapeHtml(r.text)}</div>`).join("")}</div>
  </section>

  <section class="panel">
    <h2>Why This Blew Up</h2>
    <ul>${issue.whyItBlewUp.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  </section>

  <section class="panel">
    <h2>Two Perspectives</h2>
    <div class="grid-two">
      <div class="panel"><strong>Why some are outraged</strong><p>${escapeHtml(issue.whyPeopleDisagree.sideA)}</p></div>
      <div class="panel"><strong>Why some think it is overblown</strong><p>${escapeHtml(issue.whyPeopleDisagree.sideB)}</p></div>
    </div>
  </section>

  <section class="panel" data-issue="${escapeHtml(issue.slug)}">
    <h2>Community Pulse</h2>
    <div class="grid-two">
      <button class="vote" data-vote="agree">Agree</button>
      <button class="vote" data-vote="disagree">Disagree</button>
      <button class="vote" data-vote="overreaction">Overreaction</button>
      <button class="vote" data-vote="justified">Justified</button>
    </div>
    <div class="scores">
      <div>Agree <strong data-count="agree">${issue.communityPulse.agree}</strong></div>
      <div>Disagree <strong data-count="disagree">${issue.communityPulse.disagree}</strong></div>
      <div>Overreaction <strong data-count="overreaction">${issue.communityPulse.overreaction}</strong></div>
      <div>Justified <strong data-count="justified">${issue.communityPulse.justified}</strong></div>
    </div>
  </section>

  <section class="panel">
    <h2>FAQ</h2>
    ${issue.faq
      .map((item) => `<div class="faq"><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(item.answer)}</p></div>`)
      .join("")}
  </section>

  <section class="panel">
    <h2>Share</h2>
    <div class="grid-two">
      <a href="https://x.com/intent/tweet?text=${encodeURIComponent(issue.title)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noreferrer">Share on X</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noreferrer">Share on Facebook</a>
      <a href="https://wa.me/?text=${encodeURIComponent(`${issue.title} — ${issue.verdict.label} ${shareUrl}`)}" target="_blank" rel="noreferrer">Share on WhatsApp</a>
      <a href="mailto:?subject=${encodeURIComponent(issue.title)}&body=${encodeURIComponent(`${issue.verdict.label}\n\n${shareUrl}`)}">Share by Email</a>
      <button class="button" data-copy="${escapeHtml(shareUrl)}">Copy link</button>
    </div>
  </section>
  `;

  return layout(issue.title, issue.context, body, extraHead);
}

function renderCollections() {
  const body = `
  <section>
    <h1>Collections</h1>
    <div class="grid">${issueCollections
      .map(
        (c) => `
      <a class="card" href="/collections/${c.slug}/">
        <div class="eyebrow">Collection</div>
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.description)}</p>
        <div class="card-tags">${c.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(" ")}</div>
      </a>`
      )
      .join("")}</div>
  </section>`;
  return layout("Collections · Emotion Radar", "Curated mood clusters.", body);
}

function renderCollectionDetail(slug: string) {
  const collection = issueCollections.find((c) => c.slug === slug);
  if (!collection) return layout("Collection not found", "Collection not found", "<p>Not found.</p>");

  const issues = listIssues().filter((issue) =>
    issue.tags.some((tag) => collection.tags.includes(tag))
  );

  const body = `
  <section>
    <h1>${escapeHtml(collection.title)}</h1>
    <p>${escapeHtml(collection.description)}</p>
    <div class="grid">${issues.map(issueCard).join("")}</div>
  </section>`;

  return layout(`${collection.title} · Emotion Radar`, collection.description, body);
}

function renderDaily() {
  const issues = listIssues();
  const body = `
  <section>
    <h1>Daily Mood</h1>
    <p>Top emotional signals today.</p>
    <div class="grid">${issues.map(issueCard).join("")}</div>
  </section>`;
  return layout("Daily · Emotion Radar", "Daily mood digest.", body);
}

function renderSearch() {
  const issues = listIssues();
  const tags = Array.from(new Set(issues.flatMap((i) => i.tags))).slice(0, 12);
  const body = `
  <section class="panel">
    <h1>Search</h1>
    <p>Find issues by keyword or tag. Works offline.</p>
    <div class="search-bar">
      <input type="search" placeholder="Search issues" data-search />
      <button class="button" data-search-clear>Clear</button>
    </div>
    <div class="tag-cloud">${tags.map((tag) => `<button class="tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join(" ")}</div>
  </section>
  <section>
    <h2>Results</h2>
    <div class="grid" data-search-results>${issues.map(issueCard).join("\n")}</div>
  </section>`;
  return layout("Search · Emotion Radar", "Search Emotion Radar issues.", body);
}

function renderAbout() {
  const body = `
  <section class="panel">
    <h1>About Emotion Radar</h1>
    <p>Emotion Radar is a sentiment visualization engine. It shows the internet's mood, not the facts.</p>
    <ul>
      <li>Emotion &gt; Information</li>
      <li>Signal &gt; Noise</li>
      <li>Speed &gt; Completeness</li>
    </ul>
    <p>All reactions are simulated, and issues are abstracted to avoid targeting individuals.</p>
  </section>`;
  return layout("About · Emotion Radar", "What Emotion Radar is and why it exists.", body);
}

function renderNotFound() {
  const body = `
  <section class="panel">
    <h1>Not Found</h1>
    <p>This page does not exist. Try the homepage.</p>
    <a class="button" href="/">Go home</a>
  </section>`;
  return layout("Not Found · Emotion Radar", "Page not found", body);
}

const style = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #0b0c10; color: #e6edf6; }
.container { max-width: 1100px; margin: 0 auto; padding: 24px; }
.topbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: rgba(255,255,255,0.04); position: sticky; top: 0; backdrop-filter: blur(6px); z-index: 10; }
.topbar a { color: #e6edf6; text-decoration: none; margin-right: 12px; }
.logo { font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.nav a { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; background: rgba(255,255,255,0.05); padding: 6px 10px; border-radius: 16px; }
.hero { display: flex; flex-wrap: wrap; gap: 24px; align-items: center; background: linear-gradient(120deg, rgba(124,92,255,0.2), rgba(255,255,255,0.02)); padding: 24px; border-radius: 20px; }
.hero h1 { margin: 0; font-size: 36px; }
.hero h1 span { display: block; color: #9fb0c7; }
.hero p { color: #9fb0c7; }
.hero-actions { display: flex; gap: 12px; margin-top: 16px; }
.eyebrow { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #9fb0c7; margin-bottom: 8px; }
.pill-grid { display: grid; gap: 8px; }
.pill-grid span { background: rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 16px; font-size: 12px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.grid-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.card { display: block; padding: 16px; border-radius: 18px; background: rgba(255,255,255,0.05); text-decoration: none; color: inherit; transition: transform 0.2s ease; }
.card:hover { transform: translateY(-2px); }
.card h3 { margin: 8px 0 6px; }
.card p { color: #a9b6c7; font-size: 14px; }
.card-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 8px; background: rgba(255,255,255,0.08); border-radius: 12px; border: none; color: inherit; cursor: pointer; }
.tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.scores { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-top: 12px; font-size: 13px; }
.verdict { margin-top: 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #9fb0c7; }
.issue-header h1 { font-size: 32px; margin: 12px 0; }
.panel { padding: 16px; border-radius: 18px; background: rgba(255,255,255,0.05); margin-top: 16px; }
.panel h2 { margin: 0 0 12px; }
.panel ul { padding-left: 18px; }
.reaction { padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.06); font-size: 13px; }
.vote { padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.08); color: #e6edf6; border: none; cursor: pointer; }
.vote:hover { background: rgba(255,255,255,0.16); }
.faq { margin-bottom: 12px; }
.footer { margin: 24px auto 40px; max-width: 1100px; padding: 0 24px; color: #9fb0c7; display: flex; justify-content: space-between; font-size: 12px; }
.button { display: inline-block; padding: 10px 16px; border-radius: 14px; background: rgba(255,255,255,0.08); color: #e6edf6; text-decoration: none; border: none; cursor: pointer; }
.button.ghost { background: transparent; border: 1px solid rgba(255,255,255,0.2); }
.bars { display: grid; gap: 8px; font-size: 12px; color: #9fb0c7; }
.bar { height: 10px; border-radius: 8px; background: rgba(255,255,255,0.1); overflow: hidden; }
.bar-anger { height: 100%; background: #ff4d4f; }
.bar-humor { height: 100%; background: #f7b500; }
.bar-division { height: 100%; background: #7c5cff; }
.search-bar { display: flex; gap: 10px; margin: 12px 0; }
.search-bar input { flex: 1; background: rgba(255,255,255,0.08); border: none; border-radius: 12px; padding: 10px 12px; color: #e6edf6; }
`;

const appJs = `
(function () {
  function readState(slug) {
    try { return JSON.parse(localStorage.getItem('vote:' + slug) || '{}'); } catch { return {}; }
  }
  function writeState(slug, state) {
    localStorage.setItem('vote:' + slug, JSON.stringify(state));
  }
  document.querySelectorAll('[data-issue]').forEach(function (section) {
    var slug = section.getAttribute('data-issue');
    var counts = {
      agree: section.querySelector('[data-count="agree"]'),
      disagree: section.querySelector('[data-count="disagree"]'),
      overreaction: section.querySelector('[data-count="overreaction"]'),
      justified: section.querySelector('[data-count="justified"]')
    };
    section.querySelectorAll('[data-vote]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-vote');
        var state = readState(slug);
        state[key] = (state[key] || 0) + 1;
        writeState(slug, state);
        if (counts[key]) counts[key].textContent = String(Number(counts[key].textContent || '0') + 1);
      });
    });
  });

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      if (!value) return;
      navigator.clipboard.writeText(value).catch(function () {});
    });
  });

  var searchInput = document.querySelector('[data-search]');
  var searchResults = document.querySelector('[data-search-results]');
  var tagButtons = document.querySelectorAll('[data-tag]');
  var clearBtn = document.querySelector('[data-search-clear]');

  function filterResults() {
    if (!searchInput || !searchResults) return;
    var query = searchInput.value.toLowerCase().trim();
    var cards = searchResults.querySelectorAll('.card');
    cards.forEach(function (card) {
      var text = card.textContent.toLowerCase();
      var tags = card.getAttribute('data-tags') || '';
      var match = text.indexOf(query) !== -1 || tags.indexOf(query) !== -1;
      card.style.display = match ? '' : 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterResults);
  }

  tagButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!searchInput) return;
      searchInput.value = btn.getAttribute('data-tag') || '';
      filterResults();
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (!searchInput) return;
      searchInput.value = '';
      filterResults();
    });
  }
})();
`;

const ogImage = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"630\" viewBox=\"0 0 1200 630\">\n  <rect width=\"1200\" height=\"630\" fill=\"#0b0c10\" />\n  <text x=\"80\" y=\"140\" fill=\"#e6edf6\" font-size=\"42\" font-family=\"Arial, sans-serif\">Emotion Radar</text>\n  <text x=\"80\" y=\"220\" fill=\"#9fb0c7\" font-size=\"28\" font-family=\"Arial, sans-serif\">Feel the internet in 10 seconds.</text>\n  <rect x=\"80\" y=\"300\" width=\"420\" height=\"16\" rx=\"8\" fill=\"#ff4d4f\" />\n  <rect x=\"80\" y=\"340\" width=\"360\" height=\"16\" rx=\"8\" fill=\"#f7b500\" />\n  <rect x=\"80\" y=\"380\" width=\"460\" height=\"16\" rx=\"8\" fill=\"#7c5cff\" />\n</svg>`;

async function main() {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  await writeFile(path.join(assetsDir, "style.css"), style, "utf8");
  await writeFile(path.join(assetsDir, "app.js"), appJs, "utf8");
  await writeFile(path.join(outDir, "og-image.svg"), ogImage, "utf8");

  await writeFile(path.join(outDir, "index.html"), renderHome(), "utf8");
  await mkdir(path.join(outDir, "daily"), { recursive: true });
  await writeFile(path.join(outDir, "daily", "index.html"), renderDaily(), "utf8");
  await mkdir(path.join(outDir, "about"), { recursive: true });
  await writeFile(path.join(outDir, "about", "index.html"), renderAbout(), "utf8");
  await mkdir(path.join(outDir, "search"), { recursive: true });
  await writeFile(path.join(outDir, "search", "index.html"), renderSearch(), "utf8");
  await writeFile(path.join(outDir, "404.html"), renderNotFound(), "utf8");

  await mkdir(path.join(outDir, "issue"), { recursive: true });
  for (const issue of listIssues()) {
    const issueDir = path.join(outDir, "issue", issue.slug);
    await mkdir(issueDir, { recursive: true });
    await writeFile(path.join(issueDir, "index.html"), renderIssue(issue.slug), "utf8");
  }

  await mkdir(path.join(outDir, "collections"), { recursive: true });
  await writeFile(path.join(outDir, "collections", "index.html"), renderCollections(), "utf8");
  for (const collection of issueCollections) {
    const dir = path.join(outDir, "collections", collection.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), renderCollectionDetail(collection.slug), "utf8");
  }

  const sitemap = [
    `${siteUrl}/`,
    `${siteUrl}/daily/`,
    `${siteUrl}/about/`,
    `${siteUrl}/search/`,
    `${siteUrl}/collections/`,
    ...issueCollections.map((c) => `${siteUrl}/collections/${c.slug}/`),
    ...listIssues().map((issue) => `${siteUrl}/issue/${issue.slug}/`)
  ]
    .map((url) => `<url><loc>${url}</loc></url>`)
    .join("\n");

  await writeFile(
    path.join(outDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap}\n</urlset>`
  );

  await writeFile(
    path.join(outDir, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
    "utf8"
  );

  const faviconSrc = path.join(process.cwd(), "favicon.ico");
  try { await copyFile(faviconSrc, path.join(outDir, "favicon.ico")); } catch {}
  const faviconSvg = path.join(process.cwd(), "favicon.svg");
  try { await copyFile(faviconSvg, path.join(outDir, "favicon.svg")); } catch {}

  const headersSrc = path.join(process.cwd(), "_headers");
  try { await copyFile(headersSrc, path.join(outDir, "_headers")); } catch {}
}

main();

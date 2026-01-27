# Emotion Radar — Runbook

Emotion Radar is an emotion-first sentiment visualization platform.
It summarizes how the internet *feels* about abstract issues — not the facts.

This repo is designed to run as a public MVP. It includes:
- editorial workflow (draft → review → publish)
- safe seed intake and automated draft generation
- daily radar aggregation
- creator export tools and n8n-ready shorts packaging
- mock accounts, feature gates, API keys, and public APIs
- privacy-safe analytics events, ranking, and experiments
- DQ (data quality) gates and nightly quality runs
- follow tags, in-app notifications, and ops tooling

Important constraints:
- No scraping of social platforms
- No real-person targeting or defamation
- Reactions are simulated, never real quotes

---

## 1) Local Setup

1. Install dependencies.

```bash
npm install
```

2. Create your environment file.

```bash
cp .env.example .env
```

3. Update `.env` with real secrets.
- Set `CRON_SECRET`, `SESSION_SECRET`, and `API_KEYS_SALT`.
- Set `NEXT_PUBLIC_SITE_URL` to your real domain in production.
- Set `ADMIN_PASSWORD` before any public deployment.

4. Generate Prisma client.

```bash
npm run prisma:generate
```

5. Create the database schema.

Preferred (migrations):

```bash
npm run db:migrate
```

Simple (push schema):

```bash
npm run db:push
```

OpenSSL-free fallback (this environment):

```bash
npm run db:manual
```

6. Seed safe sample data.

```bash
npm run db:seed
```

OpenSSL-free fallback seed:

```bash
npm run db:manual-seed
```

7. Run the app.

```bash
npm run dev
```

If your environment cannot load Prisma due to OpenSSL issues:

```bash
DEMO_MODE=true npm run dev
```

--- 

## 2) Core URLs (Local)

Public:
- `/`
- `/issue/[slug]`
- `/daily`
- `/search`
- `/submit`
- `/notifications`
- `/status`

Admin (noindex):
- `/admin/issues`
- `/admin/issues/[id]`
- `/admin/issue-intake`
- `/admin/seeds`
- `/admin/jobs`
- `/admin/users`
- `/admin/feedback`
- `/admin/experiments`
- `/admin/ops`
- `/admin/ready`
- `/admin/login`

Account:
- `/login`
- `/account/api-keys`

Health:
- `/api/health`

---

## 3) Cron / Scheduler (Serverless-Friendly)

This project uses protected cron endpoints instead of a worker process.

Cron endpoints:
- `POST /api/cron/hourly`
- `POST /api/cron/daily`

Required header:
- `x-cron-secret: <CRON_SECRET>`

Quick local test (dev server must be running):

```bash
npm run cron:test
```

Production setup:
- Configure platform cron to call both endpoints.
- Always include the `x-cron-secret` header.

Hourly cron runs:
- `HourlyIssueDraftJob`
- `HourlyTrendAggregationJob`

Daily cron runs:
- `DailyRadarJob`
- `NightlyQualityJob`

---

## 4) Seed Queue & Automated Drafts

Seed queue:
- Admin: `/admin/seeds`
- Public submit: `/submit`

Hourly cron flow:
1. Selects pending seeds
2. Sanitizes seed text
3. Generates a structured draft safely
4. Stores as `DRAFT`
5. Runs DQ checks on creation
6. Never auto-publishes

---

## 5) Editorial Workflow + DQ Gates

Editorial states:
- `DRAFT`
- `IN_REVIEW`
- `PUBLISHED`
- `ARCHIVED`

Key screens:
- Draft list: `/admin/issues?status=DRAFT`
- Issue editor: `/admin/issues/[id]`
- Intake: `/admin/issue-intake`
- Feedback queue: `/admin/feedback`

Safety and quality gates:
- DQ runs on draft creation, publish attempts, and nightly.
- A `BLOCK_PUBLISH` DQ result prevents publishing by default.
- `requiresEdit` also blocks publishing by default.
- You can override only with:
  - `ALLOW_UNSAFE_PUBLISH=true` (not recommended)

---

## 6) Ranking, Feed, and Analytics Events

Privacy-safe event ingestion:
- `POST /api/events`

Feed API (ranking engine):
- `GET /api/feed?mode=trending|new|funny|angry|divided|for_you|following`

Tracked events include:
- `ISSUE_CARD_VIEW`
- `ISSUE_OPEN`
- `ISSUE_SCROLL_25`
- `ISSUE_SCROLL_75`
- `VOTE_SUBMIT`
- `SHARE_CLICK`
- `EXPORT_CLICK`
- `SEARCH_QUERY`
- `ISSUE_FEEDBACK`
- `EXPERIMENT_EXPOSURE`

---

## 7) Search

Search page:
- `/search`

Search is:
- server-side
- sanitized
- ranked by relevance + trend blending

---

## 8) Creator Tools and Shorts Automation (n8n-Friendly)

Shorts package endpoints:
- `GET /api/issues/[id]/shorts-package`
- `POST /api/shorts/package` (issueId or seedText)

Send to n8n:
- `POST /api/shorts/send`
- Creates a `ShortsJob`
- Uses `Idempotency-Key`
- Sends `X-Webhook-Secret`

Webhook ingestion:
- `POST /api/webhooks/n8n/ingest`
- Required header: `x-webhook-secret`

n8n setup:
1. Use Prisma Studio:

```bash
npm run db:studio
```

2. Open `AppSetting` and set:
- `n8nWebhookUrl`
- `shortsWebhookSecret`

3. Configure n8n to:
- accept `shortsPackage`
- call back to `/api/webhooks/n8n/ingest`

---

## 9) Follows and Notifications

Follow tags (session + user):
- `GET /api/tags/followed`
- `POST /api/tags/follow`

Notifications (user):
- `/notifications`
- `POST /api/notifications/mark-read`

Publishing triggers notifications for logged-in users who follow matching tags.

---

## 10) Experiments (A/B Testing)

Admin UI:
- `/admin/experiments`

Experiment assignment is:
- deterministic per session
- persisted in DB
- tracked via `EXPERIMENT_EXPOSURE`

Live experiments wired into the product:
- `HOME_LAYOUT_DENSITY`
- `FEED_ORDER_TWEAK`
- `SHARE_CTA_COPY`

---

## 11) Ops, Health, and Panic Switches

Health check:
- `/api/health`
- Includes DB connectivity, job freshness, and panic switches

Ops dashboard:
- `/admin/ops`
- `/admin/ready`

Panic switches (env-driven):
- `DISABLE_GENERATION`
- `DISABLE_EXPORTS`
- `DISABLE_WEBHOOKS`
- `DISABLE_SIGNUP`
- `READ_ONLY_MODE`

Effects:
- generation pipeline halts when disabled
- exports and webhook flows return 503 when disabled
- login/signup is blocked when disabled

---

## 12) Accounts, Plans, and Feature Gates

This repo uses a mock login for now.

Login:
- `/login`

Mock billing (admin):
- `/admin/users`
- Toggle FREE vs PRO

Feature gates:
- FREE:
  - shorts exports limited to 3/day
- PRO:
  - API access
  - weekly reports
  - unlimited exports

---

## 13) Public API

Published-only API endpoints:
- `GET /api/public/issues`
- `GET /api/public/issues/[slug]`
- `GET /api/public/daily`

API keys:
- Manage at `/account/api-keys`
- Include via:
  - `Authorization: Bearer <token>`
  - or `x-api-key: <token>`

Rate limits:
- Anonymous: tighter per-IP limits
- PRO keys: higher per-key limits + usage tracking

---

## 14) Environment Variables

Minimum required:
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `CRON_SECRET`
- `SESSION_SECRET`
- `API_KEYS_SALT`
- `SHORTS_WEBHOOK_SECRET`
- `ADMIN_PASSWORD` (if any admin tooling is exposed publicly)

Strongly recommended:
- `ALLOW_UNSAFE_PUBLISH=false`
- all panic switches set to `false`
- `DEMO_MODE=true` in environments without OpenSSL / Prisma support

Panic switches:
- `DISABLE_GENERATION`
- `DISABLE_EXPORTS`
- `DISABLE_WEBHOOKS`
- `DISABLE_SIGNUP`
- `READ_ONLY_MODE`

See `.env.example` for a complete template.

---

## 15) Cloudflare Pages Deployment (Safe Path)

Because this repo can run in `DEMO_MODE`, the safest public deployment path is:

1. In Cloudflare Pages, set environment variables:
- `DEMO_MODE=true`
- `ADMIN_PASSWORD=<strong password>`
- all panic switches to `false`

2. Use the Next.js build preset settings:
- Build command: `npx @cloudflare/next-on-pages@1`
- Build output directory: `.vercel/output/static`

3. After deploy:
- Visit `/admin/login`
- Unlock admin
- Visit `/admin/ready` and confirm it looks clean

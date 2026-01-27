import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import initSqlJs from "sql.js";

const cwd = process.cwd();
const dbPath = path.join(cwd, "dev.db");

function log(msg, meta) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  // eslint-disable-next-line no-console
  console.log(`[sqlite-seed] ${msg}${payload}`);
}

function cuid() {
  return `c_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function utcDateString(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function run(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
}

async function main() {
  if (!fs.existsSync(dbPath)) {
    throw new Error("dev.db not found. Run: npm run db:manual");
  }

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(cwd, "node_modules", "sql.js", "dist", file)
  });

  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  log("Opened dev.db", { dbPath });

  try {
    db.exec("PRAGMA foreign_keys=ON;");
    db.exec("BEGIN TRANSACTION;");

    // Clear volatile tables first in a dependency-safe order.
    const clearTables = [
      "Assignment",
      "Experiment",
      "IssueMetricsDaily",
      "QualityReport",
      "IssueFeedback",
      "IssueRevision",
      "Notification",
      "FollowTag",
      "Hide",
      "Event",
      "IssueTimelineEvent",
      "ReactionSample",
      "Vote",
      "IssueGenerationLog",
      "ShortsJob",
      "DailyRadar",
      "SeedItem",
      "AuditLog",
      "ApiUsageDaily",
      "FeatureUsageDaily",
      "ApiKey",
      "Subscription",
      "User",
      "AdminUser",
      "AppSetting",
      "IssueTranslation",
      "Issue"
    ];

    for (const table of clearTables) {
      run(db, `DELETE FROM "${table}";`);
    }

    const createdAt = nowIso();

    // Admin users
    const adminOwnerId = cuid();
    const adminEditorId = cuid();
    run(
      db,
      `INSERT INTO "AdminUser" (id, email, role, createdAt) VALUES (?, ?, ?, ?);`,
      [adminOwnerId, "owner@emotionradar.local", "OWNER", createdAt]
    );
    run(
      db,
      `INSERT INTO "AdminUser" (id, email, role, createdAt) VALUES (?, ?, ?, ?);`,
      [adminEditorId, "editor@emotionradar.local", "EDITOR", createdAt]
    );

    // App settings
    const appSettingId = cuid();
    run(
      db,
      `INSERT INTO "AppSetting" (id, n8nWebhookUrl, shortsWebhookSecret, siteName, brandColor, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        appSettingId,
        "",
        "dev-shorts-secret",
        "Emotion Radar",
        "#7c5cff",
        createdAt,
        createdAt
      ]
    );

    // Users and subscriptions
    const userFreeId = cuid();
    const userProId = cuid();
    run(db, `INSERT INTO "User" (id, email, createdAt) VALUES (?, ?, ?);`, [
      userFreeId,
      "free@emotionradar.local",
      createdAt
    ]);
    run(db, `INSERT INTO "User" (id, email, createdAt) VALUES (?, ?, ?);`, [
      userProId,
      "pro@emotionradar.local",
      createdAt
    ]);

    run(
      db,
      `INSERT INTO "Subscription" (id, userId, plan, status, currentPeriodEnd, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [cuid(), userFreeId, "FREE", "ACTIVE", null, createdAt, createdAt]
    );
    run(
      db,
      `INSERT INTO "Subscription" (id, userId, plan, status, currentPeriodEnd, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [cuid(), userProId, "PRO", "ACTIVE", null, createdAt, createdAt]
    );

    // Experiments
    const experiments = [
      {
        key: "HOME_LAYOUT_DENSITY",
        status: "RUNNING",
        variants: [
          { name: "control", weight: 60 },
          { name: "compact", weight: 40 }
        ]
      },
      {
        key: "FEED_ORDER_TWEAK",
        status: "RUNNING",
        variants: [
          { name: "control", weight: 70 },
          { name: "recent_bias", weight: 30 }
        ]
      },
      {
        key: "SHARE_CTA_COPY",
        status: "RUNNING",
        variants: [
          { name: "control", weight: 50 },
          { name: "punchy", weight: 25 },
          { name: "discuss", weight: 25 }
        ]
      }
    ];

    for (const exp of experiments) {
      run(
        db,
        `INSERT INTO "Experiment" (id, key, status, variantsJson, targetingJson, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [cuid(), exp.key, exp.status, JSON.stringify(exp.variants), null, createdAt, createdAt]
      );
    }

    // Seed items
    const seeds = [
      "A city proposes quiet hours for delivery scooters after midnight.",
      "A school district tests AI-assisted grading with optional human override.",
      "A streaming platform adds a public 'mood meter' to creator dashboards."
    ];
    for (const text of seeds) {
      run(
        db,
        `INSERT INTO "SeedItem" (id, text, sourceType, status, createdAt) VALUES (?, ?, ?, ?, ?);`,
        [cuid(), text, "MANUAL", "PENDING", createdAt]
      );
    }

    // Issues
    const todayKey = utcDateString();
    const issues = [
      {
        slug: "ai-grading-optional-override",
        title: "AI Grading With a Human Override",
        context:
          "A school district rolls out AI-assisted grading but requires teachers to approve final scores. Supporters see relief for burnout; critics worry it normalizes automation pressure.",
        verdict: "People are split between relief and creeping discomfort",
        dominant: "DIVISION",
        anger: 58,
        humor: 34,
        division: 81,
        tags: ["education", "ai", "policy"],
        trendScore: 76
      },
      {
        slug: "midnight-scooter-quiet-hours",
        title: "Quiet Hours for Midnight Delivery Scooters",
        context:
          "A city proposes quiet hours for delivery scooters after midnight. Residents cheer the sleep upgrade, while gig workers say the policy quietly cuts their best earning window.",
        verdict: "This feels justified to some and punishing to others",
        dominant: "ANGER",
        anger: 74,
        humor: 22,
        division: 66,
        tags: ["city-life", "work", "policy"],
        trendScore: 72
      },
      {
        slug: "public-mood-meter-creators",
        title: "A Public Mood Meter for Creators",
        context:
          "A streaming platform adds a public mood meter to creator dashboards so audiences can see if sentiment is trending angry, playful, or divided. It lands as both a mirror and a weapon.",
        verdict: "Mostly mocked, but the anxiety is real",
        dominant: "HUMOR",
        anger: 49,
        humor: 79,
        division: 68,
        tags: ["social", "creator", "product"],
        trendScore: 83
      },
      {
        slug: "rent-freeze-lottery-blocks",
        title: "Rent Freeze by Lottery Block",
        context:
          "A city experiments with rent freezes by lottery block to test localized relief. People love the ambition but hate the randomness, calling it a fairness tax disguised as science.",
        verdict: "The intent is praised, the execution is roasted",
        dominant: "DIVISION",
        anger: 69,
        humor: 57,
        division: 84,
        tags: ["city-life", "policy", "economy"],
        trendScore: 79
      },
      {
        slug: "office-focus-signal-lights",
        title: "Office Focus Lights That Signal 'Do Not Interrupt'",
        context:
          "A company rolls out desk lights that signal focus mode. It reads as helpful structure to some and emotional coldness to others who see it as a permission slip to ignore teammates.",
        verdict: "People are divided on whether this is healthy or hostile",
        dominant: "DIVISION",
        anger: 55,
        humor: 41,
        division: 77,
        tags: ["work", "productivity", "culture"],
        trendScore: 68
      }
    ];

    for (const item of issues) {
      const issueId = cuid();
      const publishedAt = new Date();
      publishedAt.setUTCHours(publishedAt.getUTCHours() - 6);
      const publishedIso = publishedAt.toISOString();

      run(
        db,
        `INSERT INTO "Issue" (
          id, slug, title, contextSummary, verdictLine, dominantEmotion,
          angerScore, humorScore, divisionScore, tags, status, requiresEdit, version,
          createdAt, updatedAt, publishedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          issueId,
          item.slug,
          item.title,
          item.context,
          item.verdict,
          item.dominant,
          item.anger,
          item.humor,
          item.division,
          item.tags.join(","),
          "PUBLISHED",
          0,
          2,
          createdAt,
          createdAt,
          publishedIso
        ]
      );

      const timeline = [
        { phase: "TRIGGER", label: "Trigger", detail: "A policy detail becomes the headline.", order: 0 },
        { phase: "ESCALATION", label: "Escalation", detail: "Different groups map it to their own fears.", order: 1 },
        { phase: "PEAK", label: "Peak", detail: "The topic becomes shorthand for a bigger argument.", order: 2 },
        { phase: "COOLING", label: "Cooling", detail: "People settle into camps and move on.", order: 3 }
      ];

      for (const t of timeline) {
        run(
          db,
          `INSERT INTO "IssueTimelineEvent" (id, issueId, phase, label, detail, "order") VALUES (?, ?, ?, ?, ?, ?);`,
          [cuid(), issueId, t.phase, t.label, t.detail, t.order]
        );
      }

      const reactions = [
        { emotionType: "ANGER", text: "This reads like a boundary issue, not a neutral tweak.", intensity: 4 },
        { emotionType: "DIVISION", text: "You can feel two different value systems colliding here.", intensity: 4 },
        { emotionType: "HUMOR", text: "The jokes are funny, but they sound nervous.", intensity: 3 },
        { emotionType: "SUPPORT", text: "The intent is better than the rollout.", intensity: 3 },
        { emotionType: "NEUTRAL", text: "People need clarity more than heat right now.", intensity: 2 },
        { emotionType: "DIVISION", text: "This is being argued as identity, not details.", intensity: 4 },
        { emotionType: "ANGER", text: "It feels like the cost lands on regular people first.", intensity: 4 },
        { emotionType: "HUMOR", text: "This will be a meme template by tonight.", intensity: 3 }
      ];

      for (const r of reactions) {
        run(
          db,
          `INSERT INTO "ReactionSample" (id, issueId, emotionType, text, intensity) VALUES (?, ?, ?, ?, ?);`,
          [cuid(), issueId, r.emotionType, r.text, r.intensity]
        );
      }

      run(
        db,
        `INSERT INTO "QualityReport" (id, issueId, qualityScore, action, flags, explanation, runType, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          cuid(),
          issueId,
          86,
          "PASS",
          "",
          "Looks publishable: structure is intact and risk signals are low.",
          "ON_PUBLISH",
          createdAt
        ]
      );

      run(
        db,
        `INSERT INTO "IssueMetricsDaily" (
          id, issueId, date, impressions, opens, shares, votes, exports, trendScore
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          cuid(),
          issueId,
          todayKey,
          1200,
          420,
          95,
          210,
          48,
          item.trendScore
        ]
      );

      // A few synthetic events to make feeds and analytics feel alive.
      const eventTypes = ["ISSUE_CARD_VIEW", "ISSUE_OPEN", "VOTE_SUBMIT", "SHARE_CLICK", "EXPORT_CLICK"];
      for (let i = 0; i < 20; i += 1) {
        const eventName = eventTypes[i % eventTypes.length];
        run(
          db,
          `INSERT INTO "Event" (id, sessionHash, userId, eventName, issueId, tags, metadataJson, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            cuid(),
            `session_${(i % 7) + 1}`,
            null,
            eventName,
            issueId,
            item.tags.join(","),
            JSON.stringify({ seeded: true, idx: i }),
            createdAt
          ]
        );
      }
    }

    // Daily radar
    run(
      db,
      `INSERT INTO "DailyRadar" (id, date, topIssueIds, angerIndex, humorIndex, divisionIndex, summaryText, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        cuid(),
        todayKey,
        issues.slice(0, 3).map((i) => i.slug).join(","),
        66,
        58,
        79,
        "Division leads today: people agree on the feeling but not the fix.",
        createdAt
      ]
    );

    // Follow tags + notifications (user-scoped)
    const followTags = ["ai", "policy", "work"];
    for (const tag of followTags) {
      run(
        db,
        `INSERT INTO "FollowTag" (id, tag, sessionHash, userId, createdAt) VALUES (?, ?, ?, ?, ?);`,
        [cuid(), tag, null, userProId, createdAt]
      );
    }

    run(
      db,
      `INSERT INTO "Notification" (id, userId, type, payloadJson, readAt, createdAt) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        cuid(),
        userProId,
        "NEW_ISSUE_IN_TAG",
        JSON.stringify({ slug: issues[0].slug, title: issues[0].title, tags: issues[0].tags }),
        null,
        createdAt
      ]
    );

    // Mark a job run so ops dashboards are not empty.
    run(
      db,
      `INSERT INTO "JobRun" (id, jobName, status, startedAt, finishedAt, errorMessage, metaJson)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [cuid(), "HourlyTrendAggregationJob", "SUCCEEDED", createdAt, createdAt, null, JSON.stringify({ seeded: true })]
    );

    db.exec("COMMIT;");

    const out = db.export();
    fs.writeFileSync(dbPath, Buffer.from(out));
    log("Seed applied successfully", { dbPath, issues: issues.length });
  } catch (err) {
    db.exec("ROLLBACK;");
    log("Seed failed", { error: err instanceof Error ? err.message : String(err) });
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main().catch((err) => {
  log("Seed crashed", { error: err instanceof Error ? err.message : String(err) });
  process.exitCode = 1;
});

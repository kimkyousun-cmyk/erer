import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";

const cwd = process.cwd();
const dbPath = path.join(cwd, "dev.db");

function log(msg, meta) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  // eslint-disable-next-line no-console
  console.log(`[sqlite-migrate] ${msg}${payload}`);
}

function tableExists(db, name) {
  const stmt = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1"
  );
  stmt.bind([name]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

function columnExists(db, table, column) {
  if (!tableExists(db, table)) return false;
  const stmt = db.prepare(`PRAGMA table_info(${table});`);
  let found = false;
  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (row.name === column) {
      found = true;
      break;
    }
  }
  stmt.free();
  return found;
}

function run(db, sql) {
  db.exec(sql);
}

function createTablesIfMissing(db) {
  run(
    db,
    `
CREATE TABLE IF NOT EXISTS "Issue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "contextSummary" TEXT NOT NULL,
  "verdictLine" TEXT NOT NULL,
  "dominantEmotion" TEXT NOT NULL,
  "angerScore" INTEGER NOT NULL,
  "humorScore" INTEGER NOT NULL,
  "divisionScore" INTEGER NOT NULL,
  "tags" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "requiresEdit" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" DATETIME
);

CREATE TABLE IF NOT EXISTS "IssueTimelineEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReactionSample" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "emotionType" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "intensity" INTEGER NOT NULL,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Vote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "sessionHash" TEXT NOT NULL,
  "agree" INTEGER,
  "justified" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "IssueGenerationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT,
  "inputText" TEXT NOT NULL,
  "outputJson" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DailyRadar" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL UNIQUE,
  "topIssueIds" TEXT NOT NULL,
  "angerIndex" INTEGER NOT NULL,
  "humorIndex" INTEGER NOT NULL,
  "divisionIndex" INTEGER NOT NULL,
  "summaryText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ShortsJob" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "externalRunId" TEXT,
  "webhookUrl" TEXT,
  "resultVideoUrl" TEXT,
  "resultAssetsJson" TEXT,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastHeartbeatAt" DATETIME,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'EDITOR',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorAdminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "issueId" TEXT,
  "beforeJson" TEXT,
  "afterJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodEnd" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" DATETIME,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ApiUsageDaily" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "apiKeyId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FeatureUsageDaily" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "featureName" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AppSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "n8nWebhookUrl" TEXT,
  "shortsWebhookSecret" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "brandColor" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SeedItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" DATETIME,
  "rejectReason" TEXT
);

CREATE TABLE IF NOT EXISTS "JobRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" DATETIME,
  "errorMessage" TEXT,
  "metaJson" TEXT
);

-- Phase 4 tables
CREATE TABLE IF NOT EXISTS "QualityReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "qualityScore" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "flags" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "runType" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionHash" TEXT NOT NULL,
  "userId" TEXT,
  "eventName" TEXT NOT NULL,
  "issueId" TEXT,
  "tags" TEXT,
  "metadataJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "IssueMetricsDaily" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "opens" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "votes" INTEGER NOT NULL DEFAULT 0,
  "exports" INTEGER NOT NULL DEFAULT 0,
  "trendScore" REAL NOT NULL DEFAULT 0,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Experiment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "variantsJson" TEXT NOT NULL,
  "targetingJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Assignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "experimentId" TEXT NOT NULL,
  "sessionHash" TEXT NOT NULL,
  "userId" TEXT,
  "variantName" TEXT NOT NULL,
  "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Hide" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "sessionHash" TEXT,
  "userId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FollowTag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tag" TEXT NOT NULL,
  "sessionHash" TEXT,
  "userId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "IssueFeedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "sessionHash" TEXT,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "IssueRevision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "fromVersion" INTEGER NOT NULL,
  "toVersion" INTEGER NOT NULL,
  "diffSummary" TEXT NOT NULL,
  "editorAdminId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("editorAdminId") REFERENCES "AdminUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payloadJson" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "IssueTranslation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contextSummary" TEXT NOT NULL,
  "verdictLine" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`
  );
}

function createIndexes(db) {
  run(
    db,
    `
CREATE INDEX IF NOT EXISTS "Issue_status_publishedAt_idx" ON "Issue" ("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "Issue_dominantEmotion_idx" ON "Issue" ("dominantEmotion");
CREATE INDEX IF NOT EXISTS "Issue_publishedAt_createdAt_idx" ON "Issue" ("publishedAt", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "IssueTimelineEvent_issueId_order_key" ON "IssueTimelineEvent" ("issueId", "order");
CREATE INDEX IF NOT EXISTS "IssueTimelineEvent_issueId_order_idx" ON "IssueTimelineEvent" ("issueId", "order");

CREATE INDEX IF NOT EXISTS "ReactionSample_issueId_emotionType_idx" ON "ReactionSample" ("issueId", "emotionType");

CREATE UNIQUE INDEX IF NOT EXISTS "Vote_issueId_sessionHash_key" ON "Vote" ("issueId", "sessionHash");
CREATE INDEX IF NOT EXISTS "Vote_issueId_createdAt_idx" ON "Vote" ("issueId", "createdAt");

CREATE INDEX IF NOT EXISTS "IssueGenerationLog_createdAt_idx" ON "IssueGenerationLog" ("createdAt");

CREATE INDEX IF NOT EXISTS "ShortsJob_issueId_createdAt_idx" ON "ShortsJob" ("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "ShortsJob_status_updatedAt_idx" ON "ShortsJob" ("status", "updatedAt");

CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog" ("action", "createdAt");

CREATE INDEX IF NOT EXISTS "Subscription_userId_status_idx" ON "Subscription" ("userId", "status");
CREATE INDEX IF NOT EXISTS "ApiKey_userId_createdAt_idx" ON "ApiKey" ("userId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ApiUsageDaily_apiKeyId_date_key" ON "ApiUsageDaily" ("apiKeyId", "date");
CREATE INDEX IF NOT EXISTS "ApiUsageDaily_date_count_idx" ON "ApiUsageDaily" ("date", "count");

CREATE UNIQUE INDEX IF NOT EXISTS "FeatureUsageDaily_userId_featureName_date_key" ON "FeatureUsageDaily" ("userId", "featureName", "date");
CREATE INDEX IF NOT EXISTS "FeatureUsageDaily_featureName_date_idx" ON "FeatureUsageDaily" ("featureName", "date");

CREATE INDEX IF NOT EXISTS "SeedItem_status_createdAt_idx" ON "SeedItem" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "SeedItem_sourceType_createdAt_idx" ON "SeedItem" ("sourceType", "createdAt");

CREATE INDEX IF NOT EXISTS "JobRun_jobName_startedAt_idx" ON "JobRun" ("jobName", "startedAt");
CREATE INDEX IF NOT EXISTS "JobRun_status_startedAt_idx" ON "JobRun" ("status", "startedAt");

-- Phase 4 indexes
CREATE INDEX IF NOT EXISTS "QualityReport_issueId_createdAt_idx" ON "QualityReport" ("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "QualityReport_action_createdAt_idx" ON "QualityReport" ("action", "createdAt");

CREATE INDEX IF NOT EXISTS "Event_eventName_createdAt_idx" ON "Event" ("eventName", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_issueId_createdAt_idx" ON "Event" ("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "Event_sessionHash_createdAt_idx" ON "Event" ("sessionHash", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "IssueMetricsDaily_issueId_date_key" ON "IssueMetricsDaily" ("issueId", "date");
CREATE INDEX IF NOT EXISTS "IssueMetricsDaily_date_trendScore_idx" ON "IssueMetricsDaily" ("date", "trendScore");

CREATE INDEX IF NOT EXISTS "Experiment_status_updatedAt_idx" ON "Experiment" ("status", "updatedAt");

CREATE UNIQUE INDEX IF NOT EXISTS "Assignment_experimentId_sessionHash_key" ON "Assignment" ("experimentId", "sessionHash");
CREATE INDEX IF NOT EXISTS "Assignment_experimentId_variantName_idx" ON "Assignment" ("experimentId", "variantName");
CREATE INDEX IF NOT EXISTS "Assignment_userId_assignedAt_idx" ON "Assignment" ("userId", "assignedAt");

CREATE INDEX IF NOT EXISTS "Hide_issueId_createdAt_idx" ON "Hide" ("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "Hide_sessionHash_createdAt_idx" ON "Hide" ("sessionHash", "createdAt");
CREATE INDEX IF NOT EXISTS "Hide_userId_createdAt_idx" ON "Hide" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "FollowTag_tag_createdAt_idx" ON "FollowTag" ("tag", "createdAt");
CREATE INDEX IF NOT EXISTS "FollowTag_sessionHash_createdAt_idx" ON "FollowTag" ("sessionHash", "createdAt");
CREATE INDEX IF NOT EXISTS "FollowTag_userId_createdAt_idx" ON "FollowTag" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "IssueFeedback_issueId_type_createdAt_idx" ON "IssueFeedback" ("issueId", "type", "createdAt");
CREATE INDEX IF NOT EXISTS "IssueFeedback_sessionHash_createdAt_idx" ON "IssueFeedback" ("sessionHash", "createdAt");
CREATE INDEX IF NOT EXISTS "IssueFeedback_userId_createdAt_idx" ON "IssueFeedback" ("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "IssueRevision_issueId_createdAt_idx" ON "IssueRevision" ("issueId", "createdAt");
CREATE INDEX IF NOT EXISTS "IssueRevision_editorAdminId_createdAt_idx" ON "IssueRevision" ("editorAdminId", "createdAt");

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification" ("userId", "readAt");

CREATE UNIQUE INDEX IF NOT EXISTS "IssueTranslation_issueId_locale_key" ON "IssueTranslation" ("issueId", "locale");
CREATE INDEX IF NOT EXISTS "IssueTranslation_locale_createdAt_idx" ON "IssueTranslation" ("locale", "createdAt");
`
  );
}

function recreateIssueIfNeeded(db) {
  if (!tableExists(db, "Issue")) {
    return;
  }
  if (columnExists(db, "Issue", "version")) {
    return;
  }

  log("Issue table missing version column; recreating safely");

  run(db, "PRAGMA foreign_keys=OFF;");
  run(db, "BEGIN TRANSACTION;");

  run(
    db,
    `
CREATE TABLE "Issue__new" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "contextSummary" TEXT NOT NULL,
  "verdictLine" TEXT NOT NULL,
  "dominantEmotion" TEXT NOT NULL,
  "angerScore" INTEGER NOT NULL,
  "humorScore" INTEGER NOT NULL,
  "divisionScore" INTEGER NOT NULL,
  "tags" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "requiresEdit" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" DATETIME
);
`
  );

  // Copy forward all existing rows and default version to 1.
  run(
    db,
    `
INSERT INTO "Issue__new" (
  "id","slug","title","contextSummary","verdictLine","dominantEmotion",
  "angerScore","humorScore","divisionScore","tags","status","requiresEdit",
  "createdAt","updatedAt","publishedAt","version"
)
SELECT
  "id","slug","title","contextSummary","verdictLine","dominantEmotion",
  "angerScore","humorScore","divisionScore","tags","status","requiresEdit",
  "createdAt","updatedAt","publishedAt", 1
FROM "Issue";
`
  );

  run(db, "DROP TABLE \"Issue\";");
  run(db, "ALTER TABLE \"Issue__new\" RENAME TO \"Issue\";");

  run(db, "COMMIT;");
  run(db, "PRAGMA foreign_keys=ON;");
}

async function main() {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(cwd, "node_modules", "sql.js", "dist", file)
  });

  const existing = fs.existsSync(dbPath);
  const data = existing ? fs.readFileSync(dbPath) : undefined;
  const db = new SQL.Database(data);

  log(existing ? "Opened existing dev.db" : "Creating new dev.db", { dbPath });

  try {
    recreateIssueIfNeeded(db);
    createTablesIfMissing(db);
    createIndexes(db);

    const out = db.export();
    fs.writeFileSync(dbPath, Buffer.from(out));
    log("Migration applied successfully", { dbPath });
  } catch (err) {
    log("Migration failed", { error: err instanceof Error ? err.message : String(err) });
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

main();

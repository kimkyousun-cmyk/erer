-- Initial schema for Emotion Radar (SQLite dev) generated from current models.

CREATE TABLE "Issue" (
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

CREATE TABLE "IssueTimelineEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "phase" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReactionSample" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "emotionType" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "intensity" INTEGER NOT NULL,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Vote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "sessionHash" TEXT NOT NULL,
  "agree" INTEGER,
  "justified" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "IssueGenerationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT,
  "inputText" TEXT NOT NULL,
  "outputJson" TEXT NOT NULL,
  "modelName" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "DailyRadar" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL UNIQUE,
  "topIssueIds" TEXT NOT NULL,
  "angerIndex" INTEGER NOT NULL,
  "humorIndex" INTEGER NOT NULL,
  "divisionIndex" INTEGER NOT NULL,
  "summaryText" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ShortsJob" (
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

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'EDITOR',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
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

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodEnd" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ApiKey" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" DATETIME,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ApiUsageDaily" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "apiKeyId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "FeatureUsageDaily" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "featureName" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppSetting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "n8nWebhookUrl" TEXT,
  "shortsWebhookSecret" TEXT NOT NULL,
  "siteName" TEXT NOT NULL,
  "brandColor" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SeedItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" DATETIME,
  "rejectReason" TEXT
);

CREATE TABLE "JobRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobName" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" DATETIME,
  "errorMessage" TEXT,
  "metaJson" TEXT
);

CREATE TABLE "QualityReport" (
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

CREATE TABLE "Event" (
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

CREATE TABLE "IssueMetricsDaily" (
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

CREATE TABLE "Experiment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "variantsJson" TEXT NOT NULL,
  "targetingJson" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Assignment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "experimentId" TEXT NOT NULL,
  "sessionHash" TEXT NOT NULL,
  "userId" TEXT,
  "variantName" TEXT NOT NULL,
  "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("experimentId") REFERENCES "Experiment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Hide" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "sessionHash" TEXT,
  "userId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "FollowTag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tag" TEXT NOT NULL,
  "sessionHash" TEXT,
  "userId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "IssueFeedback" (
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

CREATE TABLE "IssueRevision" (
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

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payloadJson" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "IssueTranslation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "issueId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contextSummary" TEXT NOT NULL,
  "verdictLine" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Issue_status_publishedAt_idx" ON "Issue" ("status", "publishedAt");
CREATE INDEX "Issue_dominantEmotion_idx" ON "Issue" ("dominantEmotion");
CREATE INDEX "Issue_publishedAt_createdAt_idx" ON "Issue" ("publishedAt", "createdAt");

CREATE UNIQUE INDEX "IssueTimelineEvent_issueId_order_key" ON "IssueTimelineEvent" ("issueId", "order");
CREATE INDEX "IssueTimelineEvent_issueId_order_idx" ON "IssueTimelineEvent" ("issueId", "order");

CREATE INDEX "ReactionSample_issueId_emotionType_idx" ON "ReactionSample" ("issueId", "emotionType");

CREATE UNIQUE INDEX "Vote_issueId_sessionHash_key" ON "Vote" ("issueId", "sessionHash");
CREATE INDEX "Vote_issueId_createdAt_idx" ON "Vote" ("issueId", "createdAt");

CREATE INDEX "IssueGenerationLog_createdAt_idx" ON "IssueGenerationLog" ("createdAt");

CREATE INDEX "ShortsJob_issueId_createdAt_idx" ON "ShortsJob" ("issueId", "createdAt");
CREATE INDEX "ShortsJob_status_updatedAt_idx" ON "ShortsJob" ("status", "updatedAt");

CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog" ("entityType", "entityId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog" ("action", "createdAt");

CREATE INDEX "Subscription_userId_status_idx" ON "Subscription" ("userId", "status");
CREATE INDEX "ApiKey_userId_createdAt_idx" ON "ApiKey" ("userId", "createdAt");
CREATE UNIQUE INDEX "ApiUsageDaily_apiKeyId_date_key" ON "ApiUsageDaily" ("apiKeyId", "date");
CREATE INDEX "ApiUsageDaily_date_count_idx" ON "ApiUsageDaily" ("date", "count");

CREATE UNIQUE INDEX "FeatureUsageDaily_userId_featureName_date_key" ON "FeatureUsageDaily" ("userId", "featureName", "date");
CREATE INDEX "FeatureUsageDaily_featureName_date_idx" ON "FeatureUsageDaily" ("featureName", "date");

CREATE INDEX "SeedItem_status_createdAt_idx" ON "SeedItem" ("status", "createdAt");
CREATE INDEX "SeedItem_sourceType_createdAt_idx" ON "SeedItem" ("sourceType", "createdAt");

CREATE INDEX "JobRun_jobName_startedAt_idx" ON "JobRun" ("jobName", "startedAt");
CREATE INDEX "JobRun_status_startedAt_idx" ON "JobRun" ("status", "startedAt");

CREATE INDEX "QualityReport_issueId_createdAt_idx" ON "QualityReport" ("issueId", "createdAt");
CREATE INDEX "QualityReport_action_createdAt_idx" ON "QualityReport" ("action", "createdAt");

CREATE INDEX "Event_eventName_createdAt_idx" ON "Event" ("eventName", "createdAt");
CREATE INDEX "Event_issueId_createdAt_idx" ON "Event" ("issueId", "createdAt");
CREATE INDEX "Event_sessionHash_createdAt_idx" ON "Event" ("sessionHash", "createdAt");

CREATE UNIQUE INDEX "IssueMetricsDaily_issueId_date_key" ON "IssueMetricsDaily" ("issueId", "date");
CREATE INDEX "IssueMetricsDaily_date_trendScore_idx" ON "IssueMetricsDaily" ("date", "trendScore");

CREATE INDEX "Experiment_status_updatedAt_idx" ON "Experiment" ("status", "updatedAt");

CREATE UNIQUE INDEX "Assignment_experimentId_sessionHash_key" ON "Assignment" ("experimentId", "sessionHash");
CREATE INDEX "Assignment_experimentId_variantName_idx" ON "Assignment" ("experimentId", "variantName");
CREATE INDEX "Assignment_userId_assignedAt_idx" ON "Assignment" ("userId", "assignedAt");

CREATE INDEX "Hide_issueId_createdAt_idx" ON "Hide" ("issueId", "createdAt");
CREATE INDEX "Hide_sessionHash_createdAt_idx" ON "Hide" ("sessionHash", "createdAt");
CREATE INDEX "Hide_userId_createdAt_idx" ON "Hide" ("userId", "createdAt");

CREATE INDEX "FollowTag_tag_createdAt_idx" ON "FollowTag" ("tag", "createdAt");
CREATE INDEX "FollowTag_sessionHash_createdAt_idx" ON "FollowTag" ("sessionHash", "createdAt");
CREATE INDEX "FollowTag_userId_createdAt_idx" ON "FollowTag" ("userId", "createdAt");

CREATE INDEX "IssueFeedback_issueId_type_createdAt_idx" ON "IssueFeedback" ("issueId", "type", "createdAt");
CREATE INDEX "IssueFeedback_sessionHash_createdAt_idx" ON "IssueFeedback" ("sessionHash", "createdAt");
CREATE INDEX "IssueFeedback_userId_createdAt_idx" ON "IssueFeedback" ("userId", "createdAt");

CREATE INDEX "IssueRevision_issueId_createdAt_idx" ON "IssueRevision" ("issueId", "createdAt");
CREATE INDEX "IssueRevision_editorAdminId_createdAt_idx" ON "IssueRevision" ("editorAdminId", "createdAt");

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification" ("userId", "createdAt");
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification" ("userId", "readAt");

CREATE UNIQUE INDEX "IssueTranslation_issueId_locale_key" ON "IssueTranslation" ("issueId", "locale");
CREATE INDEX "IssueTranslation_locale_createdAt_idx" ON "IssueTranslation" ("locale", "createdAt");

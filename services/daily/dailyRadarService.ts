import { prisma } from "@/lib/db/prisma";
import { getCached, setCached } from "@/lib/cache/simpleCache";
import { logger } from "@/lib/log";
import { isDemoMode } from "@/lib/demo";
import { computeIssueScores } from "@/services/aggregation/issueAggregation";
import { toIssueSummary } from "@/services/issues/issueMapper";
import { listIssues as listSeedIssues } from "@/services/issueGenerator";
import { DailyRadarRepo } from "@/repositories/daily/dailyRadarRepo";

const CACHE_PREFIX = "daily-radar:";
const TTL_SECONDS = 300;

function todayString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function parseTopIssueIds(raw: string) {
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .slice(0, 8);
}

function summaryFromIndices(input: { anger: number; humor: number; division: number }) {
  const { anger, humor, division } = input;
  if (division >= anger && division >= humor) {
    return "The radar is polarized today — people are splitting along identity and values.";
  }
  if (anger >= humor) {
    return "The mood is protective and sharp — boundary-setting energy is leading the conversation.";
  }
  return "The internet is processing today through jokes and memes, even when the topic is serious underneath.";
}

async function computeIndices(issueIds: string[]) {
  if (issueIds.length === 0) {
    return { angerIndex: 50, humorIndex: 50, divisionIndex: 50 };
  }

  const issues = await prisma.issue.findMany({
    where: { id: { in: issueIds } },
    select: { id: true, angerScore: true, humorScore: true, divisionScore: true }
  });

  const aggregates = await Promise.all(issues.map((issue) => computeIssueScores(issue)));

  const angerIndex = Math.round(aggregates.reduce((sum, a) => sum + a.anger, 0) / aggregates.length);
  const humorIndex = Math.round(aggregates.reduce((sum, a) => sum + a.humor, 0) / aggregates.length);
  const divisionIndex = Math.round(aggregates.reduce((sum, a) => sum + a.division, 0) / aggregates.length);

  return { angerIndex, humorIndex, divisionIndex };
}

function demoRadar(date: string) {
  const seed = listSeedIssues();
  const ranked = [...seed].sort((a, b) => {
    const heatA = a.scores.anger + a.scores.humor + a.scores.division;
    const heatB = b.scores.anger + b.scores.humor + b.scores.division;
    return heatB - heatA;
  });
  const top = ranked.slice(0, 5);
  const angerIndex = Math.round(top.reduce((s, i) => s + i.scores.anger, 0) / top.length);
  const humorIndex = Math.round(top.reduce((s, i) => s + i.scores.humor, 0) / top.length);
  const divisionIndex = Math.round(top.reduce((s, i) => s + i.scores.division, 0) / top.length);
  return {
    date,
    topIssueIds: top.map((i) => i.id).join(","),
    angerIndex,
    humorIndex,
    divisionIndex,
    summaryText: summaryFromIndices({ anger: angerIndex, humor: humorIndex, division: divisionIndex }),
    createdAt: new Date()
  };
}

export async function generateDailyRadar(date: string) {
  if (isDemoMode()) {
    return demoRadar(date);
  }

  const issues = await prisma.issue.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 40
  });

  const aggregates = await Promise.all(
    issues.map(async (issue) => {
      const agg = await computeIssueScores(issue);
      return {
        issue,
        agg,
        heat: agg.anger + agg.humor + agg.division
      };
    })
  );

  aggregates.sort((a, b) => b.heat - a.heat);
  const top = aggregates.slice(0, 5);
  const topIssueIds = top.map((t) => t.issue.id);

  const angerIndex = top.length > 0 ? Math.round(top.reduce((s, t) => s + t.agg.anger, 0) / top.length) : 50;
  const humorIndex = top.length > 0 ? Math.round(top.reduce((s, t) => s + t.agg.humor, 0) / top.length) : 50;
  const divisionIndex = top.length > 0 ? Math.round(top.reduce((s, t) => s + t.agg.division, 0) / top.length) : 50;

  const summaryText = summaryFromIndices({ anger: angerIndex, humor: humorIndex, division: divisionIndex });

  const saved = await DailyRadarRepo.upsert({
    date,
    topIssueIds,
    angerIndex,
    humorIndex,
    divisionIndex,
    summaryText
  });

  return saved;
}

export async function getDailyRadarView(date = todayString()) {
  const cacheKey = `${CACHE_PREFIX}${date}`;
  const cached = getCached<Awaited<ReturnType<typeof buildView>>>(cacheKey);
  if (cached) return cached;

  if (isDemoMode()) {
    const radar = demoRadar(date);
    const topIssues = radar.topIssueIds.split(",").map((id) => listSeedIssues().find((i) => i.id === id)).filter(Boolean);
    const view = {
      date,
      indices: {
        angerIndex: radar.angerIndex,
        humorIndex: radar.humorIndex,
        divisionIndex: radar.divisionIndex
      },
      deltas: { anger: 0, humor: 0, division: 0 },
      summaryText: radar.summaryText,
      topIssues: topIssues as ReturnType<typeof listSeedIssues>
    };
    setCached(cacheKey, view, TTL_SECONDS);
    return view;
  }

  try {
    const radar = (await DailyRadarRepo.getByDate(date)) ?? (await generateDailyRadar(date));
    const view = await buildView(radar.date, radar.topIssueIds);
    setCached(cacheKey, view, TTL_SECONDS);
    return view;
  } catch (err) {
    logger.warn("daily_radar.view_fallback", {
      date,
      error: err instanceof Error ? err.message : String(err)
    });

    const seed = listSeedIssues().slice(0, 5);
    return {
      date,
      indices: { angerIndex: 60, humorIndex: 52, divisionIndex: 70 },
      deltas: { anger: 0, humor: 0, division: 0 },
      summaryText: "Daily radar fallback mode — database not ready yet.",
      topIssues: seed
    };
  }
}

async function buildView(date: string, topIssueIdsRaw: string) {
  const topIssueIds = parseTopIssueIds(topIssueIdsRaw);

  const [topIssues, todayIndices, yesterdayRadar] = await Promise.all([
    prisma.issue.findMany({
      where: { id: { in: topIssueIds }, status: "PUBLISHED" },
      include: {
        timelineEvents: { orderBy: { order: "asc" } },
        reactions: true,
        shortsJobs: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    computeIndices(topIssueIds),
    DailyRadarRepo.getByDate(todayString(-1))
  ]);

  const summaries = await Promise.all(topIssues.map((issue) => toIssueSummary(issue)));

  const yesterdayIndices = yesterdayRadar
    ? await computeIndices(parseTopIssueIds(yesterdayRadar.topIssueIds))
    : todayIndices;

  const deltas = {
    anger: todayIndices.angerIndex - yesterdayIndices.angerIndex,
    humor: todayIndices.humorIndex - yesterdayIndices.humorIndex,
    division: todayIndices.divisionIndex - yesterdayIndices.divisionIndex
  };

  return {
    date,
    indices: todayIndices,
    deltas,
    summaryText: summaryFromIndices({
      anger: todayIndices.angerIndex,
      humor: todayIndices.humorIndex,
      division: todayIndices.divisionIndex
    }),
    topIssues: summaries
  };
}

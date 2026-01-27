import { logger } from "@/lib/log";
import { generateDailyRadar } from "@/services/daily/dailyRadarService";

export interface DailyRadarJobResult {
  date: string;
  topIssueIds: string[];
}

export async function runDailyRadarJob(): Promise<DailyRadarJobResult> {
  const date = new Date().toISOString().slice(0, 10);
  const radar = await generateDailyRadar(date);
  const topIssueIds = radar.topIssueIds
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .slice(0, 5);

  logger.info("daily_radar_job.completed", {
    date,
    topIssueCount: topIssueIds.length
  });

  return { date, topIssueIds };
}

import { TrendAggregationService } from "@/services/analytics/trendAggregationService";

export async function runHourlyTrendAggregationJob() {
  return TrendAggregationService.aggregateUtcDay(new Date());
}

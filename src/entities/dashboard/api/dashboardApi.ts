import { http } from "@/shared/api/http"
import type {
  AnalyticsDailyResponse,
  AnalyticsOverviewResponse,
  AnalyticsPagesResponse,
  AnalyticsStatsRange,
  DashboardCounts,
} from "../model/types"

export async function getDashboardCounts(): Promise<DashboardCounts> {
  return await http.get("/dashboard/home")
}

export async function getAnalyticsOverview(params: AnalyticsStatsRange): Promise<AnalyticsOverviewResponse> {
  return await http.get("/analytics/stats/overview", { params })
}

export async function getAnalyticsDaily(params: AnalyticsStatsRange): Promise<AnalyticsDailyResponse> {
  return await http.get("/analytics/stats/daily", { params })
}

export async function getAnalyticsPages(params: AnalyticsStatsRange): Promise<AnalyticsPagesResponse> {
  return await http.get("/analytics/stats/pages", { params })
}

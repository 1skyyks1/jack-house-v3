import { http } from "@/shared/api/http"
import type {
  AnalyticsAudienceResponse,
  AnalyticsDailyResponse,
  AnalyticsOverviewResponse,
  AnalyticsPagesResponse,
  AnalyticsStatsRange,
  DashboardUserGrowthResponse,
} from "../model/types"

export async function getAnalyticsAudience(params: AnalyticsStatsRange): Promise<AnalyticsAudienceResponse> {
  return await http.get("/analytics/stats/audience", { params: { appId: params.appId } })
}

export async function getDashboardUserGrowth(days = 30): Promise<DashboardUserGrowthResponse> {
  return await http.get("/dashboard/users/daily", { params: { days } })
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

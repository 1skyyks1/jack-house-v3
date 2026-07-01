import { useQuery } from "@tanstack/react-query"
import { getAnalyticsDaily, getAnalyticsOverview, getAnalyticsPages, getDashboardCounts } from "./dashboardApi"
import type { AnalyticsStatsRange } from "../model/types"

export const dashboardQueryKeys = {
  analyticsDaily: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "daily", params] as const,
  analyticsOverview: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "overview", params] as const,
  analyticsPages: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "pages", params] as const,
  counts: ["dashboard", "counts"] as const,
}

export function useDashboardCountsQuery() {
  return useQuery({
    queryFn: getDashboardCounts,
    queryKey: dashboardQueryKeys.counts,
  })
}

export function useAnalyticsOverviewQuery(params: AnalyticsStatsRange) {
  return useQuery({
    queryFn: () => getAnalyticsOverview(params),
    queryKey: dashboardQueryKeys.analyticsOverview(params),
    retry: false,
    staleTime: 60_000,
  })
}

export function useAnalyticsDailyQuery(params: AnalyticsStatsRange) {
  return useQuery({
    queryFn: () => getAnalyticsDaily(params),
    queryKey: dashboardQueryKeys.analyticsDaily(params),
    retry: false,
    staleTime: 60_000,
  })
}

export function useAnalyticsPagesQuery(params: AnalyticsStatsRange) {
  return useQuery({
    queryFn: () => getAnalyticsPages(params),
    queryKey: dashboardQueryKeys.analyticsPages(params),
    retry: false,
    staleTime: 60_000,
  })
}

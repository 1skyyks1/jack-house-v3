import { useQuery } from "@tanstack/react-query"
import { getAnalyticsAudience, getAnalyticsDaily, getAnalyticsOverview, getAnalyticsPages, getDashboardBusinessAnalytics, getDashboardUserGrowth } from "./dashboardApi"
import type { AnalyticsStatsRange } from "../model/types"

export const dashboardQueryKeys = {
  analyticsAudience: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "audience", params] as const,
  analyticsDaily: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "daily", params] as const,
  analyticsOverview: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "overview", params] as const,
  analyticsPages: (params: AnalyticsStatsRange) => ["dashboard", "analytics", "pages", params] as const,
  businessAnalytics: (hours: number) => ["dashboard", "business", hours] as const,
  userGrowth: (days: number) => ["dashboard", "users", "growth", days] as const,
}

export function useDashboardBusinessAnalyticsQuery(hours = 24) {
  return useQuery({
    queryFn: () => getDashboardBusinessAnalytics(hours),
    queryKey: dashboardQueryKeys.businessAnalytics(hours),
    retry: false,
    staleTime: 60_000,
  })
}

export function useAnalyticsAudienceQuery(params: AnalyticsStatsRange) {
  return useQuery({
    queryFn: () => getAnalyticsAudience(params),
    queryKey: dashboardQueryKeys.analyticsAudience(params),
    retry: false,
    staleTime: 60_000,
  })
}

export function useDashboardUserGrowthQuery(days = 30) {
  return useQuery({
    queryFn: () => getDashboardUserGrowth(days),
    queryKey: dashboardQueryKeys.userGrowth(days),
    staleTime: 60_000,
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

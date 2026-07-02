export type DashboardUserGrowthPoint = {
  date: string
  new_users: number | string
  total_users: number | string
}

export type DashboardUserGrowthResponse = {
  daily: DashboardUserGrowthPoint[]
  days: number
  ok: boolean
}

export type AnalyticsStatsRange = {
  appId?: string
  from?: string
  to?: string
}

export type AnalyticsOverview = {
  active_ms: number | string
  pv: number | string
  sessions: number | string
  users: number | string
  uv: number | string
}

export type AnalyticsDailyPoint = {
  active_ms: number | string
  date: string
  pv: number | string
  sessions: number | string
  users?: number | string
  uv: number | string
}

export type AnalyticsPageStats = {
  path: string
  pv: number | string
  sessions: number | string
  users: number | string
  uv: number | string
}

export type AnalyticsOverviewResponse = {
  appId: string
  ok: boolean
  overview: AnalyticsOverview
}

export type AnalyticsDailyResponse = {
  appId: string
  daily: AnalyticsDailyPoint[]
  ok: boolean
}

export type AnalyticsPagesResponse = {
  appId: string
  ok: boolean
  pages: AnalyticsPageStats[]
}

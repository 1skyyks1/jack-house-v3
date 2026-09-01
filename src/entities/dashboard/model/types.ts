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

export type DashboardBusinessAnalyticsResponse = {
  hours: number
  ok: boolean
  osuRequests: {
    total: number
    trend: Array<{
      bucket: string
      requests: number
    }>
    users: Array<{
      avatar: string | null
      requests: number
      userId: number
      userName: string
    }>
  }
  packs: Array<{
    artist: string | null
    packId: number
    title: string
    views: number
  }>
}

export type AnalyticsStatsRange = {
  appId?: string
  from?: string
  to?: string
}

export type AnalyticsAudienceResponse = {
  appId: string
  days: number
  devices: Array<{
    device: "desktop" | "mobile" | "tablet" | "unknown"
    visitors: number
  }>
  ok: boolean
  screens: Array<{
    height: number
    visitors: number
    width: number
  }>
  timezones: Array<{
    timezone: string
    visitors: number
  }>
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

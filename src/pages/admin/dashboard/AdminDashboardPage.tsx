import { ChartLineUp } from "@phosphor-icons/react"
import { lazy, Suspense, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useAnalyticsDailyQuery,
  useAnalyticsOverviewQuery,
  useAnalyticsPagesQuery,
  useDashboardUserGrowthQuery,
  type AnalyticsDailyPoint,
  type AnalyticsPageStats,
  type DashboardUserGrowthPoint as ApiDashboardUserGrowthPoint,
} from "@/entities/dashboard"
import { AdminPage } from "@/features/admin-shell"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardChartSummary, DashboardDailyPoint, DashboardPagePoint, DashboardUserGrowthPoint } from "./DashboardCharts"

const analyticsDays = 30
const analyticsAppId = "jack-house-v3"
const DashboardCharts = lazy(() => import("./DashboardCharts").then((module) => ({ default: module.DashboardCharts })))

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const [analyticsRange] = useState(() => getLastDaysRange(analyticsDays))
  const analyticsParams = { appId: analyticsAppId, ...analyticsRange }
  const overviewQuery = useAnalyticsOverviewQuery(analyticsParams)
  const dailyQuery = useAnalyticsDailyQuery(analyticsParams)
  const pagesQuery = useAnalyticsPagesQuery(analyticsParams)
  const userGrowthQuery = useDashboardUserGrowthQuery(analyticsDays)

  const overview = overviewQuery.data?.overview
  const rawDailyData = dailyQuery.data?.daily ?? []
  const dailyData = normalizeDaily(rawDailyData, analyticsRange)
  const pageData = normalizePages(pagesQuery.data?.pages ?? [])
  const userGrowthData = normalizeUserGrowth(userGrowthQuery.data?.daily ?? [])
  const hasDailyLoginUsers = rawDailyData.some(hasLoginUserField)
  const analyticsError = overviewQuery.isError || dailyQuery.isError || pagesQuery.isError
  const analyticsLoading = overviewQuery.isLoading || dailyQuery.isLoading || pagesQuery.isLoading
  const hasAnalyticsOverview = !analyticsError && Boolean(overview)
  const chartLoading = analyticsLoading || userGrowthQuery.isLoading
  const hasAnalyticsCharts = !analyticsError && (dailyData.length > 0 || pageData.length > 0)
  const hasUserGrowthChart = !userGrowthQuery.isError && userGrowthData.length > 0
  const hasDashboardCharts = hasAnalyticsCharts || hasUserGrowthChart
  const chartSummary = getChartSummary(dailyData, userGrowthData, hasAnalyticsOverview ? toNumber(overview?.users) : undefined, hasAnalyticsOverview ? toNumber(overview?.active_ms) : undefined)

  return (
    <AdminPage className="h-full min-h-0">
      <div className="min-h-0 flex-1">
        {analyticsError ? (
          <section className="rounded-lg border border-dashed bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-muted p-2 text-muted-foreground">
                <ChartLineUp className="size-5" weight="bold" />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold">{t("admin.dashboard.noTrafficData")}</h2>
              </div>
            </div>
          </section>
        ) : chartLoading ? (
          <DashboardLoadingSkeleton />
        ) : !hasDashboardCharts ? (
          <DashboardChartFallback label={t("admin.dashboard.noTrafficData")} />
        ) : (
          <Suspense fallback={<DashboardLoadingSkeleton />}>
            <DashboardCharts
              dailyData={analyticsError ? [] : dailyData}
              hasDailyLoginUsers={hasDailyLoginUsers}
              isLoading={false}
              pageData={analyticsError ? [] : pageData}
              summary={chartSummary}
              userGrowthData={userGrowthQuery.isError ? [] : userGrowthData}
            />
          </Suspense>
        )}
      </div>
    </AdminPage>
  )
}

function DashboardLoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-2 xl:gap-4 xl:space-y-0">
      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-64 rounded-xl xl:h-full" key={index} />
        ))}
      </section>
      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton className="h-64 rounded-xl xl:h-full" key={index} />
        ))}
      </section>
    </div>
  )
}

function DashboardChartFallback({ label }: { label: string }) {
  return (
    <div className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-2 xl:gap-4 xl:space-y-0">
      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <ChartFallbackCard key={index} label={label} />
        ))}
      </section>
      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <ChartFallbackCard key={index} label={label} />
        ))}
      </section>
    </div>
  )
}

function ChartFallbackCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 xl:h-full xl:min-h-0">
      <div className="grid h-[220px] place-items-center rounded-md border border-dashed bg-background text-sm text-muted-foreground xl:h-full xl:min-h-0">
        {label}
      </div>
    </div>
  )
}

function getLastDaysRange(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - (days - 1))
  return {
    from: toDateInput(from),
    to: toDateInput(to),
  }
}

function normalizeDaily(rows: AnalyticsDailyPoint[], range: { from: string; to: string }): DashboardDailyPoint[] {
  const rowsByDate = new Map(rows.map((row) => [toDateKey(row.date), row]))

  return eachDate(range.from, range.to).map((date) => {
    const row = rowsByDate.get(date)

    return {
      activeMinutes: Math.round(toNumber(row?.active_ms) / 60_000),
      date,
      dateLabel: formatShortDate(date),
      pv: toNumber(row?.pv),
      users: toNumber(row?.users),
      uv: toNumber(row?.uv),
    }
  })
}

function hasLoginUserField(row: AnalyticsDailyPoint) {
  return row.users !== undefined && row.users !== null
}

function normalizePages(rows: AnalyticsPageStats[]): DashboardPagePoint[] {
  return rows
    .filter((row) => isPublicPagePath(row.path))
    .slice(0, 8)
    .map((row) => ({
      label: compactPath(row.path),
      path: row.path,
      pv: toNumber(row.pv),
    }))
}

function normalizeUserGrowth(rows: ApiDashboardUserGrowthPoint[]): DashboardUserGrowthPoint[] {
  return rows.map((row) => ({
    date: row.date,
    dateLabel: formatShortDate(row.date),
    newUsers: toNumber(row.new_users),
    totalUsers: toNumber(row.total_users),
  }))
}

function getChartSummary(dailyData: DashboardDailyPoint[], userGrowthData: DashboardUserGrowthPoint[], loginUsers?: number, activeMs?: number): DashboardChartSummary {
  const traffic = dailyData.reduce(
    (total, item) => ({
      pv: total.pv + item.pv,
      uv: total.uv + item.uv,
    }),
    { pv: 0, uv: 0 },
  )
  const currentUserPoint = userGrowthData[userGrowthData.length - 1]
  const newUsers = userGrowthData.reduce((total, item) => total + item.newUsers, 0)

  return {
    activeLabel: formatDuration(activeMs ?? dailyData.reduce((total, item) => total + item.activeMinutes * 60_000, 0)),
    loginUsers,
    newUsers,
    totalUsers: currentUserPoint?.totalUsers,
    traffic,
  }
}

function toNumber(value: number | string | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDuration(ms: number) {
  if (!ms) return "-"
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return `${new Intl.NumberFormat("en-US").format(hours)} h`
}

function formatShortDate(value: string | Date) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short" }).format(date)
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toDateKey(value: string | Date) {
  if (value instanceof Date) {
    return toDateInput(value)
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : toDateInput(date)
}

function eachDate(from: string, to: string) {
  const dates: string[] = []
  const current = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)

  while (current <= end) {
    dates.push(toDateInput(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

function compactPath(path: string) {
  if (path === "/") return "/"
  const pathname = getPathname(path)
  return pathname.length > 18 ? `${pathname.slice(0, 16)}...` : pathname
}

function isPublicPagePath(path: string) {
  return !getPathname(path).startsWith("/admin")
}

function getPathname(path: string) {
  try {
    return new URL(path, "https://jackhouse.local").pathname
  } catch {
    return path.split("?")[0] || path
  }
}

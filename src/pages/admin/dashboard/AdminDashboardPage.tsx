import type { ReactNode } from "react"
import { ChartLineUp, Eye, Note, Timer, UsersThree } from "@phosphor-icons/react"
import { lazy, Suspense, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useAnalyticsDailyQuery,
  useAnalyticsOverviewQuery,
  useAnalyticsPagesQuery,
  useDashboardCountsQuery,
  type AnalyticsDailyPoint,
  type AnalyticsPageStats,
} from "@/entities/dashboard"
import { AdminPage } from "@/features/admin-shell"
import { getErrorMessage, PageState } from "@/shared/components"
import type { DashboardDailyPoint, DashboardPagePoint } from "./DashboardCharts"

const anniversary = new Date("2027-06-01T00:00:00+08:00")
const analyticsAppId = "jack-house-v3"
const DashboardCharts = lazy(() => import("./DashboardCharts").then((module) => ({ default: module.DashboardCharts })))

export function AdminDashboardPage() {
  const { t } = useTranslation()
  const countsQuery = useDashboardCountsQuery()
  const [daysToAnniversary] = useState(() => Math.ceil((anniversary.getTime() - Date.now()) / 86_400_000))
  const [analyticsRange] = useState(() => getLastDaysRange(30))
  const analyticsParams = { appId: analyticsAppId, ...analyticsRange }
  const overviewQuery = useAnalyticsOverviewQuery(analyticsParams)
  const dailyQuery = useAnalyticsDailyQuery(analyticsParams)
  const pagesQuery = useAnalyticsPagesQuery(analyticsParams)

  if (countsQuery.isError) {
    return <PageState title={t("admin.dashboard.loadFailedTitle")} description={getErrorMessage(countsQuery.error)} />
  }

  const overview = overviewQuery.data?.overview
  const dailyData = normalizeDaily(dailyQuery.data?.daily ?? [])
  const pageData = normalizePages(pagesQuery.data?.pages ?? [])
  const analyticsError = overviewQuery.isError || dailyQuery.isError || pagesQuery.isError
  const analyticsLoading = overviewQuery.isLoading || dailyQuery.isLoading || pagesQuery.isLoading
  const hasAnalyticsOverview = !analyticsError && Boolean(overview)
  const hasAnalyticsCharts = dailyData.length > 0 || pageData.length > 0

  return (
    <AdminPage>
      <div className="space-y-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<UsersThree className="size-5" weight="bold" />}
            isLoading={countsQuery.isLoading}
            label={t("admin.dashboard.users")}
            meta={t("admin.dashboard.usersMeta")}
            value={formatNumber(countsQuery.data?.userCount)}
          />
          <MetricCard
            icon={<Note className="size-5" weight="bold" />}
            isLoading={countsQuery.isLoading}
            label={t("admin.dashboard.posts")}
            meta={t("admin.dashboard.postsMeta")}
            value={formatNumber(countsQuery.data?.postCount)}
          />
          <MetricCard
            icon={<Eye className="size-5" weight="bold" />}
            isLoading={analyticsLoading}
            label={t("admin.dashboard.pv30")}
            meta={t("admin.dashboard.analyticsSource")}
            value={hasAnalyticsOverview ? formatNumber(toNumber(overview?.pv)) : "-"}
          />
          <MetricCard
            icon={<Timer className="size-5" weight="bold" />}
            isLoading={analyticsLoading}
            label={t("admin.dashboard.activeTime")}
            meta={t("admin.dashboard.activeTimeMeta")}
            value={hasAnalyticsOverview ? formatDuration(toNumber(overview?.active_ms)) : "-"}
          />
        </section>

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
        ) : analyticsLoading ? (
          <DashboardChartFallback label={t("admin.dashboard.loadingAnalytics")} />
        ) : !hasAnalyticsCharts ? (
          <DashboardChartFallback label={t("admin.dashboard.noTrafficData")} />
        ) : (
          <Suspense fallback={<DashboardChartFallback label={t("admin.dashboard.loadingAnalytics")} />}>
            <DashboardCharts dailyData={dailyData} isLoading={false} pageData={pageData} />
          </Suspense>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <SecondaryMetric label={t("admin.dashboard.uv")} value={hasAnalyticsOverview ? formatNumber(toNumber(overview?.uv)) : "-"} />
          <SecondaryMetric label={t("admin.dashboard.sessions")} value={hasAnalyticsOverview ? formatNumber(toNumber(overview?.sessions)) : "-"} />
          <SecondaryMetric
            label={t("admin.dashboard.anniversary")}
            value={daysToAnniversary >= 0 ? t("admin.dashboard.days", { count: daysToAnniversary }) : t("admin.dashboard.passed")}
          />
        </section>
      </div>
    </AdminPage>
  )
}

type MetricCardProps = {
  icon: ReactNode
  isLoading?: boolean
  label: string
  meta?: string
  value?: string
}

function MetricCard({ icon, isLoading = false, label, meta, value }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="rounded-md bg-muted p-2 text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-5 font-heading text-3xl font-semibold">
        {isLoading ? <span className="block h-8 w-20 animate-pulse rounded bg-muted" /> : value ?? "-"}
      </div>
      {meta ? <p className="mt-2 text-xs text-muted-foreground">{meta}</p> : null}
    </div>
  )
}

function DashboardChartFallback({ label }: { label: string }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="rounded-lg border bg-card p-4">
        <div className="grid h-[280px] place-items-center rounded-md border border-dashed bg-background text-sm text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid h-[280px] place-items-center rounded-md border border-dashed bg-background text-sm text-muted-foreground">
          {label}
        </div>
      </div>
    </section>
  )
}

function SecondaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-heading text-xl font-semibold">{value}</div>
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

function normalizeDaily(rows: AnalyticsDailyPoint[]): DashboardDailyPoint[] {
  return rows.map((row) => ({
    activeMs: toNumber(row.active_ms),
    date: row.date,
    dateLabel: formatShortDate(row.date),
    pv: toNumber(row.pv),
    sessions: toNumber(row.sessions),
    uv: toNumber(row.uv),
  }))
}

function normalizePages(rows: AnalyticsPageStats[]): DashboardPagePoint[] {
  return rows.slice(0, 8).map((row) => ({
    label: compactPath(row.path),
    path: row.path,
    pv: toNumber(row.pv),
    sessions: toNumber(row.sessions),
    uv: toNumber(row.uv),
  }))
}

function toNumber(value: number | string | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: number | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : "-"
}

function formatDuration(ms: number) {
  if (!ms) return "-"
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return `${new Intl.NumberFormat("en-US").format(hours)} h`
}

function formatShortDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short" }).format(date)
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function compactPath(path: string) {
  if (path === "/") return "/"
  return path.length > 18 ? `${path.slice(0, 16)}...` : path
}

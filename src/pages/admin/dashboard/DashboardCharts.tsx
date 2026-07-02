import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export type DashboardDailyPoint = {
  activeMinutes: number
  date: string
  dateLabel: string
  pv: number
  users: number
  uv: number
}

export type DashboardPagePoint = {
  label: string
  path: string
  pv: number
}

export type DashboardUserGrowthPoint = {
  date: string
  dateLabel: string
  newUsers: number
  totalUsers: number
}

export type DashboardChartSummary = {
  activeLabel: string
  loginUsers?: number
  newUsers?: number
  totalUsers?: number
  traffic: {
    pv: number
    uv: number
  }
}

type DashboardChartsProps = {
  dailyData: DashboardDailyPoint[]
  hasDailyLoginUsers: boolean
  isLoading: boolean
  pageData: DashboardPagePoint[]
  summary: DashboardChartSummary
  userGrowthData: DashboardUserGrowthPoint[]
}

const trafficChartConfig = {
  pv: {
    color: "var(--chart-4)",
    label: "PV",
  },
  uv: {
    color: "var(--chart-2)",
    label: "UV",
  },
} satisfies ChartConfig

const pageChartConfig = {
  pv: {
    color: "var(--chart-3)",
    label: "PV",
  },
} satisfies ChartConfig

const userChartConfig = {
  users: {
    color: "var(--chart-5)",
    label: "Users",
  },
} satisfies ChartConfig

const activeChartConfig = {
  activeMinutes: {
    color: "var(--chart-4)",
    label: "Minutes",
  },
} satisfies ChartConfig

const userGrowthChartConfig = {
  totalUsers: {
    color: "var(--chart-1)",
    label: "Users",
  },
} satisfies ChartConfig

export function DashboardCharts({ dailyData, hasDailyLoginUsers, isLoading, pageData, summary, userGrowthData }: DashboardChartsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-2 xl:gap-4 xl:space-y-0">
      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-3">
        <ChartCard
          badge={t("admin.dashboard.last30Days")}
          description={t("admin.dashboard.trafficTrendDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          stats={[
            { label: t("admin.dashboard.pvTotal30"), value: formatNumber(summary.traffic.pv) },
            { label: t("admin.dashboard.uvTotal30"), value: formatNumber(summary.traffic.uv) },
          ]}
          title={t("admin.dashboard.trafficTrend")}
        >
          {dailyData.length > 0 ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={trafficChartConfig}>
              <AreaChart data={dailyData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="dateLabel" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="pv" fill="var(--color-pv)" fillOpacity={0.18} stroke="var(--color-pv)" strokeWidth={2} type="monotone" />
                <Area dataKey="uv" fill="var(--color-uv)" fillOpacity={0.12} stroke="var(--color-uv)" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noTrafficData")} />
          )}
        </ChartCard>

        <ChartCard
          badge={t("admin.dashboard.last30Days")}
          description={t("admin.dashboard.userTrendDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          stats={[{ label: t("admin.dashboard.loginUsers30"), value: formatNumber(summary.loginUsers) }]}
          title={t("admin.dashboard.userTrend")}
        >
          {dailyData.length > 0 && hasDailyLoginUsers ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={userChartConfig}>
              <LineChart data={dailyData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="dateLabel" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line dataKey="users" dot={{ r: 2 }} stroke="var(--color-users)" strokeWidth={2} type="monotone" />
              </LineChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t(hasDailyLoginUsers ? "admin.dashboard.noTrafficData" : "admin.dashboard.noLoginUserTrendData")} />
          )}
        </ChartCard>

        <ChartCard
          badge={t("admin.dashboard.last30Days")}
          description={t("admin.dashboard.userGrowthDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          stats={[
            { label: t("admin.dashboard.currentUsers"), value: formatNumber(summary.totalUsers) },
            { label: t("admin.dashboard.newUsers30"), value: formatNumber(summary.newUsers) },
          ]}
          title={t("admin.dashboard.userGrowth")}
        >
          {userGrowthData.length > 0 ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={userGrowthChartConfig}>
              <AreaChart data={userGrowthData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="dateLabel" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="totalUsers" fill="var(--color-totalUsers)" fillOpacity={0.16} stroke="var(--color-totalUsers)" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noUserData")} />
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-2">
        <ChartCard
          badge={t("admin.dashboard.last30Days")}
          description={t("admin.dashboard.activeTrendDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          stats={[{ label: t("admin.dashboard.activeTimeTotal30"), value: summary.activeLabel }]}
          title={t("admin.dashboard.activeTrend")}
        >
          {dailyData.length > 0 ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={activeChartConfig}>
              <AreaChart data={dailyData} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="dateLabel" tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="activeMinutes" fill="var(--color-activeMinutes)" fillOpacity={0.16} stroke="var(--color-activeMinutes)" strokeWidth={2} type="monotone" />
              </AreaChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noTrafficData")} />
          )}
        </ChartCard>

        <ChartCard
          badge={t("admin.dashboard.topPagesBadge")}
          description={t("admin.dashboard.topPagesDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          title={t("admin.dashboard.topPages")}
        >
          {pageData.length > 0 ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={pageChartConfig}>
              <BarChart data={pageData} layout="vertical" margin={{ bottom: 8, left: 8, right: 8, top: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis axisLine={false} tickLine={false} type="number" />
                <YAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} type="category" width={92} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pv" fill="var(--color-pv)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noPageData")} />
          )}
        </ChartCard>
      </section>
    </div>
  )
}

function ChartCard({
  badge,
  children,
  description,
  isLoading,
  loadingLabel,
  stats,
  title,
}: {
  badge: string
  children: ReactNode
  description: string
  isLoading: boolean
  loadingLabel: string
  stats?: Array<{ label: string; value: string }>
  title: string
}) {
  return (
    <div className="flex flex-col rounded-lg border bg-card xl:h-full xl:min-h-0">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          {stats && stats.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {stats.map((item) => (
                <span key={item.label} className="text-muted-foreground">
                  {item.label} <strong className="font-semibold text-foreground">{item.value}</strong>
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <div className={cn("p-4 xl:min-h-0 xl:flex-1", isLoading && "opacity-70")}>
        {isLoading ? <DashboardChartState label={loadingLabel} /> : children}
      </div>
    </div>
  )
}

export function DashboardChartState({ label }: { label: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-md border border-dashed bg-background text-sm text-muted-foreground xl:h-full xl:min-h-0">
      {label}
    </div>
  )
}

function formatNumber(value: number | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : "-"
}

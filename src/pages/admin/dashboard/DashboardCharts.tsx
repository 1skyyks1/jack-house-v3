import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export type DashboardDailyPoint = {
  activeMs: number
  date: string
  dateLabel: string
  pv: number
  sessions: number
  uv: number
}

export type DashboardPagePoint = {
  label: string
  path: string
  pv: number
  sessions: number
  uv: number
}

type DashboardChartsProps = {
  dailyData: DashboardDailyPoint[]
  isLoading: boolean
  pageData: DashboardPagePoint[]
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

export function DashboardCharts({ dailyData, isLoading, pageData }: DashboardChartsProps) {
  const { t } = useTranslation()

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <ChartCard
        badge={t("admin.dashboard.last30Days")}
        description={t("admin.dashboard.trafficTrendDescription")}
        isLoading={isLoading}
        loadingLabel={t("admin.dashboard.loadingAnalytics")}
        title={t("admin.dashboard.trafficTrend")}
      >
        {dailyData.length > 0 ? (
          <ChartContainer className="h-[280px] w-full" config={trafficChartConfig}>
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
        badge={t("admin.dashboard.topPagesBadge")}
        description={t("admin.dashboard.topPagesDescription")}
        isLoading={isLoading}
        loadingLabel={t("admin.dashboard.loadingAnalytics")}
        title={t("admin.dashboard.topPages")}
      >
        {pageData.length > 0 ? (
          <ChartContainer className="h-[280px] w-full" config={pageChartConfig}>
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
  )
}

function ChartCard({ badge, children, description, isLoading, loadingLabel, title }: { badge: string; children: ReactNode; description: string; isLoading: boolean; loadingLabel: string; title: string }) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">{badge}</Badge>
      </div>
      <div className={cn("p-4", isLoading && "opacity-70")}>
        {isLoading ? <DashboardChartState label={loadingLabel} /> : children}
      </div>
    </div>
  )
}

export function DashboardChartState({ label }: { label: string }) {
  return (
    <div className="grid h-[280px] place-items-center rounded-md border border-dashed bg-background text-sm text-muted-foreground">
      {label}
    </div>
  )
}

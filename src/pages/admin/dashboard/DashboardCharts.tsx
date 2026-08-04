import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { geoEquirectangular, geoPath } from "d3-geo"
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { feature } from "topojson-client"
import type { GeometryCollection, Topology } from "topojson-specification"
import worldAtlas from "world-atlas/countries-110m.json"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export type DashboardDailyPoint = {
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

export type DashboardChartSummary = {
  loginUsers?: number
  traffic: {
    pv: number
    uv: number
  }
}

type DashboardChartsProps = {
  audienceDevices: Array<{ device: "desktop" | "mobile" | "tablet" | "unknown"; visitors: number }>
  audienceScreens: Array<{ height: number; visitors: number; width: number }>
  audienceTimezones: Array<{ timezone: string; visitors: number }>
  dailyData: DashboardDailyPoint[]
  hasDailyLoginUsers: boolean
  isLoading: boolean
  pageData: DashboardPagePoint[]
  summary: DashboardChartSummary
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

export function DashboardCharts({ audienceDevices, audienceScreens, audienceTimezones, dailyData, hasDailyLoginUsers, isLoading, pageData, summary }: DashboardChartsProps) {
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
          description={t("admin.dashboard.deviceAndScreenDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          title={t("admin.dashboard.deviceAndScreen")}
        >
          {audienceDevices.length > 0 || audienceScreens.length > 0 ? (
            <div className="grid h-[220px] gap-5 overflow-y-auto md:grid-cols-2 xl:h-full xl:min-h-0">
              <DistributionList
                items={audienceDevices.map((item) => ({ label: t(`admin.dashboard.devices.${item.device}`), value: item.visitors }))}
                title={t("admin.dashboard.deviceDistribution")}
              />
              <DistributionList
                items={audienceScreens.map((item) => ({ label: `${item.width} × ${item.height}`, value: item.visitors }))}
                title={t("admin.dashboard.screenSizeDistribution")}
              />
            </div>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noAudienceData")} />
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:min-h-0 xl:grid-cols-2">
        <ChartCard
          badge={t("admin.dashboard.last30Days")}
          description={t("admin.dashboard.regionDescription")}
          isLoading={isLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          title={t("admin.dashboard.visitorRegions")}
        >
          {audienceTimezones.length > 0 ? (
            <VisitorTimezoneMap items={audienceTimezones} />
          ) : (
            <DashboardChartState label={t("admin.dashboard.noAudienceData")} />
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
        {isLoading ? <Skeleton className="h-[220px] w-full rounded-md xl:h-full" aria-label={loadingLabel} /> : children}
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

function DistributionList({ items, title }: { items: Array<{ label: string; value: number }>; title: string }) {
  const maximum = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-foreground" title={item.label}>{item.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumber(item.value)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((item.value / maximum) * 100, 3)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const timezoneMapWidth = 800
const timezoneMapHeight = 300
const timezoneMapProjection = geoEquirectangular().fitExtent(
  [[4, 4], [timezoneMapWidth - 4, timezoneMapHeight - 4]],
  { type: "Sphere" },
)
const timezoneMapPath = geoPath(timezoneMapProjection)
const timezoneMapSpherePath = timezoneMapPath({ type: "Sphere" }) ?? ""
const timezoneMapCountries = feature(
  worldAtlas as unknown as Topology,
  (worldAtlas as unknown as Topology).objects.countries as GeometryCollection,
) as unknown as FeatureCollection<Geometry, GeoJsonProperties>

function VisitorTimezoneMap({ items }: { items: Array<{ timezone: string; visitors: number }> }) {
  const bands = getTimezoneBands(items)
  const maximum = Math.max(...bands.map((band) => band.visitors), 1)

  return (
    <div className="h-[220px] xl:h-full xl:min-h-0">
      <svg
        aria-label="Visitor distribution by UTC timezone offset"
        className="h-full w-full"
        role="img"
        viewBox={`0 0 ${timezoneMapWidth} ${timezoneMapHeight}`}
      >
        <defs>
          <clipPath id="visitor-timezone-map-clip">
            <path d={timezoneMapSpherePath} />
          </clipPath>
        </defs>
        <path className="fill-muted stroke-border" d={timezoneMapSpherePath} strokeWidth={1} />
        <g clipPath="url(#visitor-timezone-map-clip)">
          {bands.map((band) => {
            const longitude = normalizeLongitude(band.offset * 15)
            const left = timezoneMapProjection([Math.max(longitude - 7.5, -180), 0])?.[0] ?? 0
            const right = timezoneMapProjection([Math.min(longitude + 7.5, 180), 0])?.[0] ?? left
            const opacity = 0.12 + 0.58 * Math.sqrt(band.visitors / maximum)
            const center = (left + right) / 2
            const label = `${formatUtcOffset(band.offset)} · ${formatNumber(band.visitors)}`

            return (
              <g key={band.offset}>
                <rect className="fill-primary" height={timezoneMapHeight} opacity={opacity} width={Math.max(right - left, 2)} x={left} y={0}>
                  <title>{`${label} visitors`}</title>
                </rect>
                <text
                  className="fill-foreground text-[11px] font-medium"
                  textAnchor="start"
                  transform={`rotate(-90 ${center} ${timezoneMapHeight - 9})`}
                  x={center}
                  y={timezoneMapHeight - 9}
                >
                  {label}
                </text>
              </g>
            )
          })}
        </g>
        <g className="fill-transparent stroke-border" strokeWidth={0.7}>
          {timezoneMapCountries.features.map((country, index) => (
            <path d={timezoneMapPath(country) ?? undefined} key={String(country.id ?? index)} />
          ))}
        </g>
      </svg>
    </div>
  )
}

function getTimezoneBands(items: Array<{ timezone: string; visitors: number }>) {
  const visitorsByOffset = new Map<number, number>()

  for (const item of items) {
    const offset = getTimezoneOffset(item.timezone)
    if (offset == null) continue
    visitorsByOffset.set(offset, (visitorsByOffset.get(offset) ?? 0) + item.visitors)
  }

  return [...visitorsByOffset.entries()]
    .map(([offset, visitors]) => ({ offset, visitors }))
    .sort((a, b) => a.offset - b.offset)
}

function getTimezoneOffset(timezone: string): number | null {
  try {
    const now = new Date()
    const parts = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "2-digit",
      second: "2-digit",
      timeZone: timezone,
      year: "numeric",
    }).formatToParts(now)
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    const zonedTime = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    )
    return Math.round(((zonedTime - now.getTime()) / 3_600_000) * 2) / 2
  } catch {
    return null
  }
}

function formatUtcOffset(offset: number) {
  if (offset === 0) return "UTC"
  const sign = offset > 0 ? "+" : "−"
  const absolute = Math.abs(offset)
  const hours = Math.floor(absolute)
  const minutes = absolute % 1 === 0 ? "" : `:${String(Math.round((absolute % 1) * 60)).padStart(2, "0")}`
  return `UTC${sign}${hours}${minutes}`
}

function normalizeLongitude(longitude: number) {
  return ((longitude + 180) % 360 + 360) % 360 - 180
}

function formatNumber(value: number | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : "-"
}

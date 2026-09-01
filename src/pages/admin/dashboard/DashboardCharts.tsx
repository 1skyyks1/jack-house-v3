import type { ReactNode } from "react"
import type { TFunction } from "i18next"
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
import type { DashboardBusinessAnalyticsResponse } from "@/entities/dashboard"

export type DashboardDailyPoint = {
  date: string
  dateLabel: string
  pv: number
  users: number
  uv: number
}

export type DashboardChartSummary = {
  traffic: {
    pv: number
    uv: number
  }
}

type DashboardChartsProps = {
  audienceTimezones: Array<{ timezone: string; visitors: number }>
  businessData?: DashboardBusinessAnalyticsResponse
  businessHours: number
  businessLoading: boolean
  dailyData: DashboardDailyPoint[]
  isLoading: boolean
  onBusinessHoursChange: (hours: number) => void
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

const packChartConfig = {
  views: {
    color: "var(--chart-3)",
    label: "Views",
  },
} satisfies ChartConfig

const osuRequestChartConfig = {
  requests: {
    color: "var(--chart-5)",
    label: "Requests",
  },
} satisfies ChartConfig

export function DashboardCharts({ audienceTimezones, businessData, businessHours, businessLoading, dailyData, isLoading, onBusinessHoursChange, summary }: DashboardChartsProps) {
  const { t } = useTranslation()
  const osuTrend = (businessData?.osuRequests.trend ?? []).map((item) => ({
    ...item,
    label: formatBusinessBucket(item.bucket, businessHours),
  }))
  const packData = (businessData?.packs ?? []).slice(0, 8).map((pack) => ({
    ...pack,
    label: compactLabel(pack.title, 16),
  }))

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
          badge={<BusinessRangePicker onChange={onBusinessHoursChange} value={businessHours} />}
          description={t("admin.dashboard.osuRequestsDescription")}
          isLoading={businessLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          stats={[{ label: t("admin.dashboard.requestTotal"), value: formatNumber(businessData?.osuRequests.total) }]}
          title={t("admin.dashboard.osuRequests")}
        >
          {osuTrend.length > 0 ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={osuRequestChartConfig}>
              <LineChart data={osuTrend} margin={{ left: 8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis axisLine={false} dataKey="label" minTickGap={24} tickLine={false} tickMargin={8} />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} width={36} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Line dataKey="requests" dot={false} stroke="var(--color-requests)" strokeWidth={2} type="monotone" />
              </LineChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noOsuRequestData")} />
          )}
        </ChartCard>

        <ChartCard
          badge={formatBusinessRange(t, businessHours)}
          description={t("admin.dashboard.topOsuUsersDescription")}
          isLoading={businessLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          title={t("admin.dashboard.topOsuUsers")}
        >
          {(businessData?.osuRequests.users.length ?? 0) > 0 ? (
            <DistributionList
              items={(businessData?.osuRequests.users ?? []).map((user) => ({ label: user.userName, value: user.requests }))}
            />
          ) : (
            <DashboardChartState label={t("admin.dashboard.noOsuRequestData")} />
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
          badge={formatBusinessRange(t, businessHours)}
          description={t("admin.dashboard.topPacksDescription")}
          isLoading={businessLoading}
          loadingLabel={t("admin.dashboard.loadingAnalytics")}
          title={t("admin.dashboard.topPacks")}
        >
          {packData.length > 0 ? (
            <ChartContainer className="h-[220px] w-full xl:h-full xl:min-h-0 xl:aspect-auto" config={packChartConfig}>
              <BarChart data={packData} layout="vertical" margin={{ bottom: 8, left: 8, right: 8, top: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis axisLine={false} tickLine={false} type="number" />
                <YAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} type="category" width={92} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="var(--color-views)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <DashboardChartState label={t("admin.dashboard.noPackData")} />
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
  badge: ReactNode
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
        {typeof badge === "string" ? <Badge variant="outline">{badge}</Badge> : badge}
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

function DistributionList({ items, title }: { items: Array<{ label: string; value: number }>; title?: string }) {
  const maximum = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="h-[220px] min-w-0 overflow-y-auto pr-1 xl:h-full">
      {title ? <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3> : null}
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

function BusinessRangePicker({ onChange, value }: { onChange: (hours: number) => void; value: number }) {
  const { t } = useTranslation()
  const ranges = [1, 24, 7 * 24, 14 * 24]

  return (
    <div className="flex shrink-0 rounded-md border bg-background p-0.5">
      {ranges.map((hours) => (
        <button
          className={cn(
            "rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors",
            hours === value && "bg-primary text-primary-foreground",
          )}
          key={hours}
          onClick={() => onChange(hours)}
          type="button"
        >
          {formatBusinessRange(t, hours)}
        </button>
      ))}
    </div>
  )
}

function formatBusinessRange(t: TFunction, hours: number) {
  if (hours === 1) return t("admin.dashboard.lastHour")
  if (hours === 24) return t("admin.dashboard.last24Hours")
  if (hours === 7 * 24) return t("admin.dashboard.last7Days")
  return t("admin.dashboard.last14Days")
}

function formatBusinessBucket(value: string, hours: number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", hours <= 48
    ? { day: "2-digit", hour: "2-digit", hour12: false, month: "short" }
    : { day: "2-digit", month: "short" }).format(date)
}

function compactLabel(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value
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

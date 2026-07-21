import { useEffect, useMemo, useState } from "react"
import { ArrowSquareOut } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  type TournamentMappoolStatsMap,
  type TournamentMappoolStatsStage,
  useTournamentDetailQuery,
  useTournamentMappoolStatsQuery,
  useTournamentRoundsQuery,
  type TournamentMappoolMap,
} from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AppAlert, CardGridSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { groupRoundsByMainStage, type StageRoundGroup } from "../_shared/tournamentRoundStages"
import { buildMappoolLabelMap, getMappoolLabel, sortMappoolMaps } from "../_shared/tournamentMappool"
import { getTournamentMapCoverUrl, getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentMappoolPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const mappoolStages = useMemo(() => groupRoundsByMainStage(roundsQuery.data ?? []).filter((stage) => stage.maps.length > 0), [roundsQuery.data])

  useEffect(() => {
    if (!tournamentQuery.data) return
    const canonicalPath = `${getTournamentPublicPath(tournamentQuery.data)}/mappool`
    if (location.pathname !== canonicalPath) {
      navigate(`${canonicalPath}${location.hash}`, { replace: true })
    }
  }, [location.hash, location.pathname, navigate, tournamentQuery.data])

  if (tournamentQuery.isError || roundsQuery.isError) {
    return <PageState title={t("tournament.mappool.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? roundsQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <TournamentBreadcrumb current={t("tournament.common.mappool")} tournament={tournamentQuery.data} tournamentId={tid} />
      </div>

      <MainStageMappoolTabs isLoading={roundsQuery.isLoading} stages={mappoolStages} tournamentId={tid} />
    </main>
  )
}

function MainStageMappoolTabs({ isLoading, stages, tournamentId }: { isLoading: boolean; stages: StageRoundGroup[]; tournamentId?: string }) {
  const { t } = useTranslation()
  const statsQuery = useTournamentMappoolStatsQuery(tournamentId)
  const [activeStage, setActiveStage] = useState<string>("")
  const selectedStage = stages.find((stage) => stage.key === activeStage) ?? stages[0]
  const selectedStats = statsQuery.data?.stages.find((stage) => stage.key === selectedStage?.key)
  const labeledMaps = labelMappoolMapsForStage(selectedStage?.maps ?? [])

  useEffect(() => {
    function syncStageFromHash() {
      const hashStage = window.location.hash.slice(1).trim().toLowerCase()
      if (stages.some((stage) => stage.key === hashStage)) {
        setActiveStage(hashStage)
      }
    }

    syncStageFromHash()
    window.addEventListener("hashchange", syncStageFromHash)
    return () => window.removeEventListener("hashchange", syncStageFromHash)
  }, [stages])

  if (isLoading) {
    return <CardGridSkeleton className="mt-4 lg:grid-cols-2" count={4} />
  }

  if (stages.length === 0 || !selectedStage) {
    return <AppAlert title={t("tournament.mappool.emptyTitle")}>{t("tournament.mappool.emptyDescription")}</AppAlert>
  }

  return (
    <section>
      <Tabs value={selectedStage.key} onValueChange={(value) => {
        setActiveStage(value)
        if (window.location.hash.slice(1).toLowerCase() !== value) {
          window.location.hash = value
        }
      }}>
        <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="max-w-none flex-nowrap justify-start gap-2 overflow-visible rounded-none bg-transparent p-0">
            {stages.map((stage) => (
              <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" key={stage.key} value={stage.key}>
                {stage.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {labeledMaps.map(({ label, map }, index) => (
          <MainStageMapCard
            centerInRow={labeledMaps.length % 2 === 1 && index === labeledMaps.length - 1}
            key={map.id}
            label={label}
            map={map}
          />
        ))}
      </div>

      {statsQuery.isError ? (
        <AppAlert className="mt-6" title={t("tournament.mappool.statsLoadFailed")}>{getErrorMessage(statsQuery.error)}</AppAlert>
      ) : null}

      {selectedStats ? (
        <MappoolStatsTable stage={selectedStats} />
      ) : null}
    </section>
  )
}

function MappoolStatsTable({ stage }: { stage: TournamentMappoolStatsStage }) {
  const { t } = useTranslation()
  const maps = stage.maps.map((item) => item.map)
  const labelById = buildMappoolLabelMap(maps)
  const statsByMapId = new Map(stage.maps.map((item) => [item.map.id, item]))
  const rows: Array<{ label: string; map: TournamentMappoolMap; stats: TournamentMappoolStatsMap }> = sortMappoolMaps(maps)
    .flatMap((map) => {
      const stats = statsByMapId.get(map.id) ?? stage.maps.find((item) => item.map.map_id === map.map_id && item.map.type.toUpperCase() === map.type.toUpperCase())
      return stats ? [{ label: getMappoolLabel(map, labelById), map, stats }] : []
    })
  const extrema = {
    ban: getExtrema(rows.filter(({ map }) => !isTiebreakerMap(map)).map(({ stats }) => stats.ban_count)),
    pick: getExtrema(rows.map(({ stats }) => stats.pick_count)),
    protect: getExtrema(rows.filter(({ map }) => !isTiebreakerMap(map)).map(({ stats }) => stats.protect_count)),
  }

  if (rows.length === 0) return null

  return (
    <section className="mt-8 border-t pt-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{t("tournament.mappool.statsTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("tournament.mappool.statsMeta", { count: stage.valid_match_count })}
            {" · "}
            {t("tournament.mappool.statsCalculatedAt", { time: formatDate(stage.calculated_at) })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" variant="outline">
            {t("tournament.mappool.statsHighest")}
          </Badge>
          <Badge className="border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300" variant="outline">
            {t("tournament.mappool.statsLowest")}
          </Badge>
        </div>
      </div>
      <Table>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className="border-0 hover:bg-transparent">
            <TableHead className="h-9 text-xs text-muted-foreground">{t("tournament.mappool.statsMap")}</TableHead>
            <TableHead className="h-9 text-right text-xs text-muted-foreground">{t("tournament.mappool.statsProtect")}</TableHead>
            <TableHead className="h-9 text-right text-xs text-muted-foreground">{t("tournament.mappool.statsBan")}</TableHead>
            <TableHead className="h-9 text-right text-xs text-muted-foreground">{t("tournament.mappool.statsPick")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ label, map, stats }) => {
            const isTiebreaker = isTiebreakerMap(map)

            return (
              <TableRow className="border-0 hover:bg-muted/35 [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md" key={map.id}>
                <TableCell>
                  <div className="flex items-center gap-3 sm:min-w-60">
                    <Badge variant="outline">{label}</Badge>
                    <span className="hidden min-w-0 truncate sm:block">{map.artist} - {map.title}</span>
                  </div>
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", !isTiebreaker && getExtremaClass(stats.protect_count, extrema.protect))}>
                  {isTiebreaker ? "—" : formatActionStat(stats.protect_count, stats.protect_rate)}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", !isTiebreaker && getExtremaClass(stats.ban_count, extrema.ban))}>
                  {isTiebreaker ? "—" : formatActionStat(stats.ban_count, stats.ban_rate)}
                </TableCell>
                <TableCell className={cn("text-right tabular-nums", getExtremaClass(stats.pick_count, extrema.pick))}>{formatActionStat(stats.pick_count, stats.pick_rate)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </section>
  )
}

function MainStageMapCard({ centerInRow, label, map }: { centerInRow: boolean; label: string; map: TournamentMappoolMap }) {
  const coverUrl = getTournamentMapCoverUrl(map)

  return (
    <a
      className={cn(
        "group relative block h-28 overflow-hidden rounded-md border bg-muted text-white transition hover:border-primary/50",
        centerInRow && "lg:col-span-2 lg:w-[calc(50%-0.375rem)] lg:justify-self-center",
      )}
      href={`https://osu.ppy.sh/beatmaps/${map.map_id}`}
      rel="noreferrer"
      target="_blank"
    >
      {coverUrl ? (
        <img alt="" className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]" src={coverUrl} />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.82))]" />
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-3">
          <Badge className="border-white/20 bg-black/35 text-white" variant="outline">
            {label}
          </Badge>
          <ArrowSquareOut className="mt-1 size-4 text-white/70" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{map.artist} - {map.title}</p>
          <p className="mt-1 truncate text-xs text-white/76">mapped by {map.mapper}</p>
        </div>
      </div>
    </a>
  )
}

function labelMappoolMapsForStage(maps: TournamentMappoolMap[]) {
  const labelById = buildMappoolLabelMap(maps)
  return sortMappoolMaps(maps).map((map) => ({ label: getMappoolLabel(map, labelById), map }))
}

function formatActionStat(count: number, rate: number | null) {
  return `${count} (${rate === null ? "-" : `${Math.round(rate * 100)}%`})`
}

function isTiebreakerMap(map: TournamentMappoolMap) {
  return map.type.trim().toUpperCase() === "TB"
}

function getExtrema(values: number[]) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  return min === max ? null : { max, min }
}

function getExtremaClass(value: number, extrema: { max: number; min: number } | null) {
  if (!extrema) return undefined
  if (value === extrema.max) return "bg-emerald-500/12 font-semibold text-emerald-700 dark:text-emerald-300"
  if (value === extrema.min) return "bg-amber-500/12 font-semibold text-amber-700 dark:text-amber-300"
  return undefined
}

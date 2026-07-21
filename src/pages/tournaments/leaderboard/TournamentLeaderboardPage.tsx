import { useEffect } from "react"
import { ArrowSquareOut, Medal } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  useTournamentDetailQuery,
  useTournamentPerformanceQuery,
  useTournamentRoundsQuery,
  type TournamentMappoolMap,
  type TournamentPerformanceEntry,
  type TournamentPerformanceMap,
  type TournamentPerformanceStage,
} from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AppAlert, CardGridSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { groupRoundsByMainStage } from "../_shared/tournamentRoundStages"
import { buildMappoolLabelMap, compareMappoolMaps, getMappoolLabel, normalizeMapType } from "../_shared/tournamentMappool"
import { getTournamentMapCoverUrl, getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentLeaderboardPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const leaderboardQuery = useTournamentPerformanceQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const stages = leaderboardQuery.data?.stages ?? []
  const mappoolByStage = new Map<string, TournamentMappoolMap[]>(groupRoundsByMainStage(roundsQuery.data ?? []).map((stage) => [stage.key, stage.maps]))
  const stageParam = searchParams.get("stage")?.trim().toLowerCase() ?? ""
  const mapParam = searchParams.get("map")?.trim().toLowerCase() ?? ""
  const selectedStage = stages.find((stage) => stage.key.toLowerCase() === stageParam) ?? stages[0]
  const selectedStageMaps = sortLeaderboardMaps(selectedStage?.maps ?? [])
  const selectedMapLabelById = buildLeaderboardMapLabelMap(selectedStageMaps, mappoolByStage.get(selectedStage?.key ?? ""))
  const selectedMap = selectedStageMaps.find((mapData) => getLeaderboardMapSlug(mapData, selectedMapLabelById) === mapParam) ?? selectedStageMaps[0]
  const publicTournamentPath = tournamentQuery.data ? getTournamentPublicPath(tournamentQuery.data) : `/t/${tid ?? ""}`

  useEffect(() => {
    if (!tournamentQuery.data) return
    const canonicalPath = `${getTournamentPublicPath(tournamentQuery.data)}/leaderboard`
    if (location.pathname !== canonicalPath) {
      navigate(`${canonicalPath}${location.search}${location.hash}`, { replace: true })
    }
  }, [location.hash, location.pathname, location.search, navigate, tournamentQuery.data])

  useEffect(() => {
    if (!selectedStage || !selectedMap) return

    const selectedMapSlug = getLeaderboardMapSlug(selectedMap, selectedMapLabelById)
    if (stageParam === selectedStage.key.toLowerCase() && mapParam === selectedMapSlug) return

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("stage", selectedStage.key.toLowerCase())
    nextParams.set("map", selectedMapSlug)
    setSearchParams(nextParams, { replace: true })
  }, [mapParam, searchParams, selectedMap, selectedMapLabelById, selectedStage, setSearchParams, stageParam])

  if (tournamentQuery.isError || leaderboardQuery.isError || roundsQuery.isError) {
    return <PageState title={t("tournament.leaderboard.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? leaderboardQuery.error ?? roundsQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <TournamentBreadcrumb current={t("tournament.common.leaderboard")} tournament={tournamentQuery.data} tournamentId={tid} />

      {leaderboardQuery.isLoading || roundsQuery.isLoading ? (
        <CardGridSkeleton count={4} />
      ) : stages.length === 0 || !selectedStage || !selectedMap ? (
        <AppAlert title={t("tournament.leaderboard.emptyTitle")}>{t("tournament.leaderboard.emptyDescription")}</AppAlert>
      ) : (
        <LeaderboardContent
          activeMap={getLeaderboardMapSlug(selectedMap, selectedMapLabelById)}
          activeStage={selectedStage.key}
          maps={selectedStageMaps}
          publicTournamentPath={publicTournamentPath}
          selectedMap={selectedMap}
          selectedMapLabelById={selectedMapLabelById}
          stages={stages}
          onMapChange={(value) => {
            const nextParams = new URLSearchParams(searchParams)
            nextParams.set("stage", selectedStage.key.toLowerCase())
            nextParams.set("map", value)
            setSearchParams(nextParams)
          }}
          onStageChange={(value) => {
            const nextStage = stages.find((stage) => stage.key === value)
            const nextStageMaps = sortLeaderboardMaps(nextStage?.maps ?? [])
            const nextLabelById = buildLeaderboardMapLabelMap(nextStageMaps, mappoolByStage.get(value))
            const nextMap = nextStageMaps[0]
            const nextParams = new URLSearchParams(searchParams)
            nextParams.set("stage", value.toLowerCase())
            if (nextMap) {
              nextParams.set("map", getLeaderboardMapSlug(nextMap, nextLabelById))
            } else {
              nextParams.delete("map")
            }
            setSearchParams(nextParams)
          }}
        />
      )}
    </main>
  )
}

function LeaderboardContent({
  activeMap,
  activeStage,
  maps,
  publicTournamentPath,
  selectedMap,
  selectedMapLabelById,
  stages,
  onMapChange,
  onStageChange,
}: {
  activeMap: string
  activeStage: string
  maps: TournamentPerformanceMap[]
  publicTournamentPath: string
  selectedMap: TournamentPerformanceMap
  selectedMapLabelById: Map<number, string>
  stages: TournamentPerformanceStage[]
  onMapChange: (value: string) => void
  onStageChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const entries = selectedMap.entries.slice(0, 100)

  return (
    <section className="space-y-1">
      <Tabs value={activeStage} onValueChange={onStageChange}>
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

      <Tabs value={activeMap} onValueChange={onMapChange}>
        <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="max-w-none flex-nowrap justify-start gap-2 overflow-visible rounded-none bg-transparent p-0">
            {maps.map((mapData) => (
              <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-secondary" key={mapData.key} value={getLeaderboardMapSlug(mapData, selectedMapLabelById)}>
                {mapData.map ? getMappoolLabel(mapData.map, selectedMapLabelById) : t("tournament.leaderboard.unknownMap")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <LeaderboardMapCard label={t("tournament.leaderboard.unknownMap")} map={selectedMap.map} />

      {entries.length > 0 ? (
        <div className="overflow-hidden rounded-xl bg-muted/20">
          <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_7rem] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_8rem]">
            <span>{t("tournament.common.rank")}</span>
            <span>
              <span className="md:hidden">{t("tournament.common.player")}</span>
              <span className="hidden md:inline">{t("tournament.common.team")}</span>
            </span>
            <span className="hidden md:block">{t("tournament.common.player")}</span>
            <span className="text-right">{t("tournament.leaderboard.scoreLabel")}</span>
          </div>
          <div className="divide-y">
            {entries.map((entry) => (
              <LeaderboardListRow entry={entry} key={`${entry.game_id}-${entry.side}`} publicTournamentPath={publicTournamentPath} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {t("tournament.leaderboard.noScores")}
        </div>
      )}
    </section>
  )
}

function LeaderboardMapCard({ label, map }: { label: string; map: TournamentMappoolMap | null }) {
  const coverUrl = getTournamentMapCoverUrl(map)

  if (!map) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
        {label}
      </div>
    )
  }

  return (
    <a
      className="relative block h-24 overflow-hidden rounded-xl bg-muted text-white shadow-sm"
      href={`https://osu.ppy.sh/beatmaps/${map.map_id}`}
      rel="noreferrer"
      target="_blank"
    >
      {coverUrl ? (
        <img alt="" className="absolute inset-0 size-full object-cover" src={coverUrl} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.2),transparent_35%),linear-gradient(135deg,#111827,#374151)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-black/80" />
      <div className="relative flex h-full items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="truncate font-heading text-base font-semibold">{map.artist} - {map.title}</div>
          <div className="mt-1 truncate text-xs text-white/75">mapped by {map.mapper}</div>
        </div>
        <ArrowSquareOut className="shrink-0 opacity-70" weight="bold" />
      </div>
    </a>
  )
}

function LeaderboardListRow({ entry, publicTournamentPath }: { entry: TournamentPerformanceEntry; publicTournamentPath: string }) {
  return (
    <Link
      className="grid grid-cols-[4.5rem_minmax(0,1fr)_7rem] items-center gap-3 px-4 py-3 text-sm transition hover:bg-muted/40 md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)_8rem]"
      to={`${publicTournamentPath}/match/${entry.match_id}`}
    >
      <span className="inline-flex min-w-10 items-center justify-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
        {entry.rank <= 3 ? <Medal className={cn("size-3.5", getRankIconTone(entry.rank))} weight="fill" /> : null}
        #{entry.rank}
      </span>
      <span className="min-w-0">
        <span className="hidden truncate font-medium md:block">{getEntryTeamName(entry)}</span>
        <span className="flex min-w-0 items-center gap-2 md:hidden">
          <Avatar size="sm">
            <AvatarImage src={getEntryAvatar(entry)} />
            <AvatarFallback>{getInitial(getEntryPlayerName(entry))}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate font-medium">{getEntryPlayerName(entry)}</span>
            <span className="block truncate text-xs text-muted-foreground">{getEntryTeamName(entry)}</span>
          </span>
        </span>
      </span>
      <span className="hidden min-w-0 items-center gap-2 md:flex">
        <Avatar size="sm">
          <AvatarImage src={getEntryAvatar(entry)} />
          <AvatarFallback>{getInitial(getEntryPlayerName(entry))}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate font-medium">{getEntryPlayerName(entry)}</span>
        </span>
      </span>
      <span className="text-right font-mono text-sm font-semibold tabular-nums">{formatScore(entry.score)}</span>
    </Link>
  )
}

function sortLeaderboardMaps(maps: TournamentPerformanceStage["maps"]) {
  return [...maps].sort((a, b) => {
    if (a.map && b.map) return compareMappoolMaps(a.map as TournamentMappoolMap, b.map as TournamentMappoolMap)
    if (a.map) return -1
    if (b.map) return 1
    return a.key.localeCompare(b.key)
  })
}

function buildLeaderboardMapLabelMap(performanceMaps: TournamentPerformanceMap[], mappoolMaps: TournamentMappoolMap[] = []) {
  const scoredMaps = performanceMaps.flatMap((mapData) => mapData.map ? [mapData.map] : [])
  const fallbackLabelById = buildMappoolLabelMap(scoredMaps)
  const fullMappoolLabelById = buildMappoolLabelMap(mappoolMaps)
  const fullMappoolLabelByKey = new Map(mappoolMaps.map((map) => [
    getMappoolMapIdentity(map),
    getMappoolLabel(map, fullMappoolLabelById),
  ]))

  return new Map(scoredMaps.map((map) => [
    map.id,
    fullMappoolLabelByKey.get(getMappoolMapIdentity(map)) ?? getMappoolLabel(map, fallbackLabelById),
  ]))
}

function getMappoolMapIdentity(map: TournamentMappoolMap) {
  return `${normalizeMapType(map.type)}-${map.map_id}`
}

function getLeaderboardMapSlug(mapData: TournamentPerformanceMap, labelById: Map<number, string>) {
  const label = mapData.map ? getMappoolLabel(mapData.map, labelById) : mapData.key
  return label.trim().toLowerCase()
}

function getEntryTeamName(entry: TournamentPerformanceEntry) {
  return entry.team.display_name || entry.team.name
}

function getEntryPlayerName(entry: TournamentPerformanceEntry) {
  return entry.player?.user_name_snapshot || entry.player?.user?.user_name || "-"
}

function getEntryAvatar(entry: TournamentPerformanceEntry) {
  return entry.player?.avatar_snapshot || entry.player?.user?.avatar || undefined
}

function getRankIconTone(rank: number) {
  if (rank === 1) return "text-amber-500"
  if (rank === 2) return "text-slate-400"
  return "text-orange-500"
}

function getInitial(value: string) {
  return value && value !== "-" ? value.slice(0, 1) : "?"
}

function formatScore(score: number) {
  return new Intl.NumberFormat("en-US").format(score ?? 0)
}

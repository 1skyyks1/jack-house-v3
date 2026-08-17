import { ImageSquare } from "@phosphor-icons/react"
import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import {
  type TournamentMappoolMap,
  type TournamentQualMap,
  useTournamentDetailQuery,
  useTournamentQualMappoolQuery,
  useTournamentRoundsQuery,
} from "@/entities/tournament"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { AppAlert, DetailPageSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { TournamentStatsTabs } from "../_shared/TournamentStatsTabs"
import { groupRoundsByMainStage, type StageRoundGroup } from "../_shared/tournamentRoundStages"
import { getTournamentMapCoverUrl, getTournamentPublicPath } from "../_shared/tournamentVisuals"

type MapperRankingMap = {
  artist: string
  mapId: number
  setId?: number | null
  stages: string[]
  title: string
}

type MapperRankingEntry = {
  mapper: string
  maps: MapperRankingMap[]
}

export function TournamentMapperLeaderboardPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const qualMappoolQuery = useTournamentQualMappoolQuery(tid)
  const stages = useMemo(() => groupRoundsByMainStage(roundsQuery.data ?? []), [roundsQuery.data])
  const entries = useMemo(
    () => buildMapperRanking(stages, qualMappoolQuery.data ?? []),
    [qualMappoolQuery.data, stages],
  )
  const publicTournamentPath = tournamentQuery.data ? getTournamentPublicPath(tournamentQuery.data) : `/t/${tid ?? ""}`

  useEffect(() => {
    if (!tournamentQuery.data) return
    const canonicalPath = `${getTournamentPublicPath(tournamentQuery.data)}/mappers`
    if (location.pathname !== canonicalPath) navigate(canonicalPath, { replace: true })
  }, [location.pathname, navigate, tournamentQuery.data])

  const error = tournamentQuery.error ?? roundsQuery.error ?? qualMappoolQuery.error
  if (error) {
    return <PageState title={t("tournament.mappool.mapperRankingLoadFailed")} description={getErrorMessage(error)} />
  }
  if (tournamentQuery.isLoading || roundsQuery.isLoading || qualMappoolQuery.isLoading) {
    return <DetailPageSkeleton />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TournamentBreadcrumb current={t("tournament.common.stats")} tournament={tournamentQuery.data} tournamentId={tid} />
        <TournamentStatsTabs active="mapper-leaderboard" publicTournamentPath={publicTournamentPath} />
      </div>

      <section>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold">{t("tournament.mappool.mapperRankingTitle")}</h1>
        </div>

        {entries.length === 0 ? (
          <AppAlert title={t("tournament.mappool.mapperRankingEmpty")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("tournament.mappool.mapperRankingRank")}</TableHead>
                <TableHead>{t("tournament.mappool.mapperRankingMapper")}</TableHead>
                <TableHead>{t("tournament.mappool.mapperRankingMaps")}</TableHead>
                <TableHead className="w-20 text-right">{t("tournament.mappool.mapperRankingCount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => {
                const rank = getCompetitionRank(entries, index)
                return (
                  <TableRow key={entry.mapper.toLowerCase()}>
                    <TableCell>
                      <span className={cn(
                        "inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-xs font-semibold tabular-nums",
                        rank === 1 && "bg-amber-400/20 text-amber-700 dark:text-amber-300",
                        rank === 2 && "bg-slate-400/20 text-slate-700 dark:text-slate-300",
                        rank === 3 && "bg-orange-500/15 text-orange-700 dark:text-orange-300",
                        rank > 3 && "bg-muted text-muted-foreground",
                      )}>
                        #{rank}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{entry.mapper}</TableCell>
                    <TableCell>
                      <div className="flex max-w-xl flex-wrap gap-1.5">
                        {entry.maps.map((map) => <MapThumbnail key={map.mapId} map={map} />)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-base font-semibold tabular-nums">{entry.maps.length}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </main>
  )
}

function MapThumbnail({ map }: { map: MapperRankingMap }) {
  const coverUrl = getTournamentMapCoverUrl({ map_id: map.mapId, set_id: map.setId })

  return (
    <a
      aria-label={`${map.artist} - ${map.title}`}
      className="group relative block h-10 w-16 shrink-0 overflow-hidden rounded-md border bg-muted sm:w-20"
      href={`https://osu.ppy.sh/beatmaps/${map.mapId}`}
      rel="noreferrer"
      target="_blank"
      title={`${map.artist} - ${map.title} · ${map.stages.join(" / ")}`}
    >
      {coverUrl ? (
        <img alt="" className="size-full object-cover transition duration-200 group-hover:scale-105" loading="lazy" src={coverUrl} />
      ) : (
        <span className="grid size-full place-items-center text-muted-foreground">
          <ImageSquare className="size-4" />
        </span>
      )}
      <span className="absolute inset-0 ring-inset transition group-hover:ring-2 group-hover:ring-primary/60" />
    </a>
  )
}

function buildMapperRanking(stages: StageRoundGroup[], qualifierMaps: TournamentQualMap[]): MapperRankingEntry[] {
  const entries = new Map<string, { mapper: string; maps: Map<number, { artist: string; mapId: number; setId?: number | null; stages: Set<string>; title: string }> }>()

  const addMap = (map: Pick<TournamentMappoolMap, "artist" | "map_id" | "mapper" | "set_id" | "title">, stage: string) => {
    const mapper = map.mapper.trim().replace(/\s+/g, " ")
    if (!mapper || !Number.isFinite(map.map_id)) return

    const mapperKey = mapper.toLowerCase()
    const entry = entries.get(mapperKey) ?? { mapper, maps: new Map() }
    const existingMap = entry.maps.get(map.map_id)
    if (existingMap) {
      existingMap.stages.add(stage)
    } else {
      entry.maps.set(map.map_id, {
        artist: map.artist,
        mapId: map.map_id,
        setId: map.set_id,
        stages: new Set([stage]),
        title: map.title,
      })
    }
    entries.set(mapperKey, entry)
  }

  qualifierMaps.forEach((map) => addMap(map, `Q${map.index}`))
  stages.forEach((stage) => stage.maps.forEach((map) => addMap(map, stage.label)))

  return Array.from(entries.values(), (entry) => ({
    mapper: entry.mapper,
    maps: Array.from(entry.maps.values(), (map) => ({ ...map, stages: Array.from(map.stages) }))
      .sort((left, right) => left.artist.localeCompare(right.artist) || left.title.localeCompare(right.title)),
  })).sort((left, right) => right.maps.length - left.maps.length || left.mapper.localeCompare(right.mapper))
}

function getCompetitionRank(entries: MapperRankingEntry[], index: number) {
  let rank = index + 1
  while (rank > 1 && entries[rank - 2]?.maps.length === entries[index]?.maps.length) rank--
  return rank
}

import { ArrowSquareOut, ListNumbers, MapTrifold } from "@phosphor-icons/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import {
  useTournamentDetailQuery,
  useTournamentQualMappoolQuery,
  useTournamentQualRankingQuery,
  useTournamentQualScoresQuery,
  QUAL_RANK_MODE_RANK_SUM,
  type TournamentQualMap,
  type TournamentQualScore,
  type TournamentTeam,
} from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { getTournamentMapCoverUrl } from "../_shared/tournamentVisuals"

const TOTAL_TAB = "total"
const emptyRanking: TournamentTeam[] = []
const emptyScores: TournamentQualScore[] = []
const emptyMaps: TournamentQualMap[] = []

type RankingEntry = {
  rank: number
  score: number
  team: TournamentTeam
}

export function TournamentQualifierPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const [activeTab, setActiveTab] = useState(TOTAL_TAB)
  const tournamentQuery = useTournamentDetailQuery(tid)
  const mappoolQuery = useTournamentQualMappoolQuery(tid)
  const rankingQuery = useTournamentQualRankingQuery(tid)
  const scoresQuery = useTournamentQualScoresQuery(tid)
  const tournament = tournamentQuery.data
  const maps = mappoolQuery.data ?? emptyMaps
  const totalRanking = rankingQuery.data ?? emptyRanking
  const scores = scoresQuery.data ?? emptyScores
  const isRankSumMode = tournament?.qual_rank_mode === QUAL_RANK_MODE_RANK_SUM
  const teamById = useMemo(() => new Map(totalRanking.map((team) => [team.id, team])), [totalRanking])
  const teamsWithPositiveScores = useMemo(() => {
    const teamIds = new Set<number>()
    for (const score of scores) {
      if (score.score > 0) teamIds.add(score.team_id)
    }
    return teamIds
  }, [scores])
  const mapRankings = useMemo(() => buildMapRankings(scores, teamById), [scores, teamById])
  const activeEntries = activeTab === TOTAL_TAB
    ? totalRanking.map((team, index) => ({
      rank: team.qual_rank ?? index + 1,
      score: team.qual_score ?? 0,
      team,
    })).filter((entry) => isRankSumMode ? teamsWithPositiveScores.has(entry.team.id) : entry.score > 0)
    : mapRankings.get(Number(activeTab.replace("map-", ""))) ?? []
  const needsScores = activeTab !== TOTAL_TAB || isRankSumMode
  const isLoading = rankingQuery.isLoading || (needsScores && scoresQuery.isLoading)
  const scoreLabel = activeTab === TOTAL_TAB && isRankSumMode ? t("tournament.qualifier.rankScore") : t("tournament.common.score")

  if (tournamentQuery.isError || mappoolQuery.isError || rankingQuery.isError || scoresQuery.isError) {
    return <PageState title={t("tournament.qualifier.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? mappoolQuery.error ?? rankingQuery.error ?? scoresQuery.error)} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <TournamentBreadcrumb current={t("tournament.common.qualifier")} tournament={tournament} tournamentId={tid} />

      <div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{tournament?.acronym ?? t("tournament.common.tournament")}</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">{t("tournament.common.qualifier")}</h1>
        </div>
      </div>

      <MappoolStrip isLoading={mappoolQuery.isLoading} maps={maps} />

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListNumbers className="size-5 text-muted-foreground" weight="bold" />
            <h2 className="font-heading text-xl font-semibold">{t("tournament.qualifier.ranking")}</h2>
          </div>
        </div>

        <Tabs className="mt-4" value={activeTab} onValueChange={setActiveTab}>
          <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="max-w-none flex-nowrap justify-start gap-2 overflow-visible rounded-none bg-transparent p-0">
              <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" value={TOTAL_TAB}>
                {t("tournament.qualifier.totalRanking")}
              </TabsTrigger>
              {maps.map((map) => (
                <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" key={map.id} value={`map-${map.id}`}>
                  {t("tournament.qualifier.stage", { stage: map.index })}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <div className="mt-4 overflow-hidden rounded-lg border">
          <RankingHeader scoreLabel={scoreLabel} />
          <div className="divide-y">
            {isLoading ? <p className="p-4 text-sm text-muted-foreground">{t("tournament.qualifier.loadingRanking")}</p> : null}
            {!isLoading && activeEntries.length === 0 ? (
              <div className="p-4">
                <AppAlert title={t("tournament.qualifier.noRankingTitle")}>{t("tournament.qualifier.noRankingDescription")}</AppAlert>
              </div>
            ) : null}
            {activeEntries.map((entry) => (
              <RankingRow entry={entry} key={entry.team.id} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function MappoolStrip({ isLoading, maps }: { isLoading: boolean; maps: TournamentQualMap[] }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <MapTrifold className="size-5 text-muted-foreground" weight="bold" />
        <h2 className="font-heading text-xl font-semibold">{t("tournament.qualifier.mappool")}</h2>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.loadingMaps")}</p> : null}
        {!isLoading && maps.length === 0 ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.noMaps")}</p> : null}
        {maps.map((map) => {
          const coverUrl = getTournamentMapCoverUrl(map)

          return (
            <a
              className="group relative block h-24 overflow-hidden rounded-md border bg-muted text-white transition hover:border-primary/50"
              href={`https://osu.ppy.sh/beatmaps/${map.map_id}`}
              key={map.id}
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
                    {t("tournament.qualifier.stage", { stage: map.index })}
                  </Badge>
                  <ArrowSquareOut className="mt-1 size-4 text-white/70" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{map.artist} - {map.title}</p>
                  <p className="mt-1 truncate text-xs text-white/76">{map.version ?? "-"} / {map.mapper}</p>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

function RankingHeader({ scoreLabel }: { scoreLabel: string }) {
  const { t } = useTranslation()

  return (
    <div className="hidden grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1.6fr)_8rem] gap-3 bg-muted/55 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground md:grid">
      <span>{t("tournament.qualifier.rank")}</span>
      <span>{t("tournament.common.team")}</span>
      <span>{t("tournament.common.player")}</span>
      <span className="text-right">{scoreLabel}</span>
    </div>
  )
}

function RankingRow({ entry }: { entry: RankingEntry }) {
  return (
    <article className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 bg-background px-3 py-2 md:grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1.6fr)_8rem] md:gap-3 md:px-4 md:py-3">
      <div className="min-w-0 md:block">
        <span className="font-heading text-sm font-semibold text-muted-foreground">#{entry.rank}</span>
      </div>
      <p className="min-w-0 truncate text-sm font-medium md:text-base">{entry.team.display_name || entry.team.name}</p>
      <span className="font-heading text-sm font-semibold md:hidden">{formatScore(entry.score)}</span>
      <PlayerList team={entry.team} />
      <p className="hidden text-right font-heading text-base font-semibold md:block">{formatScore(entry.score)}</p>
    </article>
  )
}

function PlayerList({ team }: { team: TournamentTeam }) {
  const { t } = useTranslation()
  const players = team.players ?? []

  if (players.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>
  }

  return (
    <div className="col-span-full flex min-w-0 flex-wrap gap-x-2 gap-y-1 md:col-span-1 md:gap-x-3 md:gap-y-2">
      {players.map((player) => (
        <Link className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-primary md:text-sm" key={player.id} to={`/user/${player.user_id}`}>
          <Avatar className="size-5 md:size-6">
            <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
            <AvatarFallback>{(player.user_name_snapshot ?? player.user?.user_name ?? "?").slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate md:max-w-36">{player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.user", { id: player.user_id })}</span>
        </Link>
      ))}
    </div>
  )
}

function buildMapRankings(scores: TournamentQualScore[], teamById: Map<number, TournamentTeam>) {
  const bestByMap = new Map<number, Map<number, RankingEntry>>()

  for (const score of scores) {
    if (score.score <= 0) continue

    const team = teamById.get(score.team_id) ?? score.team
    if (!team) continue

    const mapEntries = bestByMap.get(score.map_id) ?? new Map<number, RankingEntry>()
    const existing = mapEntries.get(score.team_id)
    if (!existing || score.score > existing.score) {
      mapEntries.set(score.team_id, {
        rank: 0,
        score: score.score,
        team,
      })
    }
    bestByMap.set(score.map_id, mapEntries)
  }

  const rankings = new Map<number, RankingEntry[]>()
  for (const [mapId, entriesByTeam] of bestByMap.entries()) {
    const entries = Array.from(entriesByTeam.values())
      .sort((a, b) => b.score - a.score || a.team.id - b.team.id)
    assignCompetitionRanks(entries)
    rankings.set(mapId, entries)
  }

  return rankings
}

function assignCompetitionRanks(entries: RankingEntry[]) {
  let currentRank = 0
  let previousScore: number | null = null

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index]
    if (previousScore === null || entry.score !== previousScore) {
      currentRank = index + 1
      previousScore = entry.score
    }
    entry.rank = currentRank
  }
}

function formatScore(score?: number | null) {
  return new Intl.NumberFormat().format(score ?? 0)
}

import { ArrowSquareOut, ChartBar, ListNumbers } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import {
  useTournamentDetailQuery,
  useTournamentQualMappoolQuery,
  useTournamentQualRankingQuery,
  type TournamentTeam,
} from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { getTournamentMapCoverUrl, getTournamentPublicPath } from "../_shared/tournamentVisuals"

export function TournamentQualifierPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const mappoolQuery = useTournamentQualMappoolQuery(tid)
  const rankingQuery = useTournamentQualRankingQuery(tid)

  if (tournamentQuery.isError || mappoolQuery.isError || rankingQuery.isError) {
    return <PageState title={t("tournament.qualifier.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? mappoolQuery.error ?? rankingQuery.error)} />
  }

  const tournament = tournamentQuery.data
  const maps = mappoolQuery.data ?? []
  const ranking = rankingQuery.data ?? []

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <TournamentBreadcrumb current={t("tournament.common.qualifier")} tournament={tournament} tournamentId={tid} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{tournament?.acronym ?? t("tournament.common.tournament")}</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">{t("tournament.common.qualifier")}</h1>
        </div>
        <Badge className="gap-1" variant="secondary">
          <ChartBar className="size-3.5" weight="bold" />
          {t("tournament.qualifier.bestScorePerMap")}
        </Badge>
      </div>

      <section className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <ListNumbers className="size-5 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold">{t("tournament.qualifier.mappool")}</h2>
          </div>
          <div className="mt-4 space-y-2">
            {mappoolQuery.isLoading ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.loadingMaps")}</p> : null}
            {!mappoolQuery.isLoading && maps.length === 0 ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.noMaps")}</p> : null}
            {maps.map((map) => {
              const coverUrl = getTournamentMapCoverUrl(map)

              return (
                <a
                  className="group relative block h-28 overflow-hidden rounded-md border bg-muted text-white transition hover:border-primary/50"
                  href={`https://osu.ppy.sh/beatmaps/${map.map_id}`}
                  key={map.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  {coverUrl ? (
                    <img alt="" className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]" src={coverUrl} />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.82))]" />
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
        </aside>

        <section className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">{t("tournament.qualifier.ranking")}</h2>
            {tournament ? (
              <Button asChild size="sm" variant="outline">
                <Link to={getTournamentPublicPath(tournament)}>
                  {t("tournament.common.tournament")}
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="mt-4 space-y-2">
            {rankingQuery.isLoading ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.loadingRanking")}</p> : null}
            {!rankingQuery.isLoading && ranking.length === 0 ? (
              <AppAlert title={t("tournament.qualifier.noRankingTitle")}>{t("tournament.qualifier.noRankingDescription")}</AppAlert>
            ) : null}
            {ranking.map((team) => (
              <RankingRow key={team.id} team={team} />
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function RankingRow({ team }: { team: TournamentTeam }) {
  const { t } = useTranslation()
  const rank = team.qual_rank ?? "-"
  const isTop = typeof rank === "number" && rank <= 3

  return (
    <article className={cn("grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[4rem_minmax(0,1fr)_8rem]", isTop && "border-primary/30 bg-primary/5")}>
      <div className="flex items-center">
        <span className={cn("font-heading text-2xl font-semibold text-muted-foreground", isTop && "text-primary")}>#{rank}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{team.display_name || team.name}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(team.players ?? []).map((player) => (
            <Link className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs" key={player.id} to={`/user/${player.user_id}`}>
              <Avatar className="size-5">
                <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
                <AvatarFallback>{(player.user_name_snapshot ?? player.user?.user_name ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              {player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.user", { id: player.user_id })}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center sm:justify-end">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{t("tournament.common.score")}</p>
          <p className="font-heading text-2xl font-semibold">{team.qual_score ?? 0}</p>
        </div>
      </div>
    </article>
  )
}

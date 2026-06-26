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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button asChild className="px-0" variant="link">
            <Link to={`/t/${tid}`}>{tournament?.acronym ?? t("tournament.common.tournament")}</Link>
          </Button>
          <h1 className="font-heading text-3xl font-semibold">{t("tournament.common.qualifier")}</h1>
        </div>
        <Badge className="gap-1" variant="secondary">
          <ChartBar className="size-3.5" weight="bold" />
          {t("tournament.qualifier.bestScorePerMap")}
        </Badge>
      </div>

      <AppAlert title={t("tournament.qualifier.publicScoreboard")}>{t("tournament.qualifier.publicScoreboardDescription")}</AppAlert>

      <section className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <ListNumbers className="size-5 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold">{t("tournament.qualifier.mappool")}</h2>
          </div>
          <div className="mt-4 space-y-2">
            {mappoolQuery.isLoading ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.loadingMaps")}</p> : null}
            {!mappoolQuery.isLoading && maps.length === 0 ? <p className="text-sm text-muted-foreground">{t("tournament.qualifier.noMaps")}</p> : null}
            {maps.map((map) => (
              <a
                className="block rounded-md border bg-background p-3 transition hover:border-primary/40"
                href={`https://osu.ppy.sh/beatmaps/${map.map_id}`}
                key={map.id}
                rel="noreferrer"
                target="_blank"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t("tournament.qualifier.stage", { stage: map.index })}</p>
                    <p className="mt-1 truncate font-medium">{map.artist} - {map.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{map.version ?? "-"} / {map.mapper}</p>
                  </div>
                  <ArrowSquareOut className="mt-1 size-4 text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="font-heading text-xl font-semibold">{t("tournament.qualifier.ranking")}</h2>
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

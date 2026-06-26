import type { ReactNode } from "react"
import type { TFunction } from "i18next"
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarDots,
  DiceFive,
  FlagCheckered,
  Trophy,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import {
  useTournamentDetailQuery,
  useTournamentMatchQuery,
  type TournamentGame,
  type TournamentMatch,
  type TournamentPlayer,
  type TournamentTeam,
} from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"

export function TournamentMatchPage() {
  const { t } = useTranslation()
  const { matchId, tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const matchQuery = useTournamentMatchQuery(tid, matchId)

  if (tournamentQuery.isError || matchQuery.isError) {
    return <PageState title={t("tournament.match.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? matchQuery.error)} />
  }

  if (tournamentQuery.isLoading || matchQuery.isLoading || !matchQuery.data) {
    return <PageState title={t("tournament.match.loading")} description={t("tournament.match.loadingDescription")} />
  }

  const tournament = tournamentQuery.data
  const match = matchQuery.data
  const title = match.round?.name ?? t("tournament.common.match", { id: match.id })
  const mpUrl = match.mp_id ? `https://osu.ppy.sh/community/matches/${match.mp_id}` : null
  const isComplete = match.status === 2

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/t">{t("tournament.common.tournaments")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/t/${tid}`}>{tournament?.acronym ?? t("tournament.common.tournament")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/t/${tid}/bracket`}>{t("tournament.common.bracket")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("tournament.common.match", { id: match.id })}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-muted/35 p-4 sm:p-5">
          <div className="space-y-3">
            <Button asChild className="h-auto px-0 text-muted-foreground" variant="link">
              <Link to={`/t/${tid}/bracket`}>
                <ArrowLeft className="size-4" />
                {t("tournament.match.backToBracket")}
              </Link>
            </Button>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={isComplete ? "default" : "outline"}>{isComplete ? t("tournament.common.completed") : t("tournament.common.notStarted")}</Badge>
                <Badge variant="secondary">{groupLabel(match.bracket_group, t)}</Badge>
                {match.result_type && match.result_type !== "normal" ? (
                  <Badge className="uppercase" variant="destructive">
                    {match.result_type}
                  </Badge>
                ) : null}
              </div>
              <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{title}</h1>
            </div>
          </div>

          <div className="grid min-w-48 grid-cols-2 overflow-hidden rounded-lg border bg-background text-center">
            <ScoreCell isWinner={match.winner_id === match.team1_id} score={match.team1_score} team={match.team1} />
            <ScoreCell isWinner={match.winner_id === match.team2_id} score={match.team2_score} team={match.team2} />
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr]">
          <TeamPanel isWinner={match.winner_id === match.team1_id} side={t("tournament.match.team", { index: 1 })} team={match.team1} />
          <div className="hidden w-px bg-border lg:block" />
          <TeamPanel isWinner={match.winner_id === match.team2_id} side={t("tournament.match.team", { index: 2 })} team={match.team2} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-4">
          <InfoPanel match={match} mpUrl={mpUrl} />
          {match.result_note ? <AppAlert title={t("tournament.match.resultNote")}>{match.result_note}</AppAlert> : null}
        </div>
        <GamesPanel games={match.games ?? []} team1={match.team1} team2={match.team2} />
      </section>
    </main>
  )
}

function ScoreCell({ isWinner, score, team }: { isWinner: boolean; score: number; team?: TournamentTeam | null }) {
  return (
    <div className={cn("flex min-w-24 flex-col gap-1 px-4 py-3", isWinner && "bg-primary/10 text-primary")}>
      <span className="truncate text-xs font-medium text-muted-foreground">{teamName(team)}</span>
      <span className="font-heading text-3xl font-semibold">{score ?? 0}</span>
    </div>
  )
}

function TeamPanel({ isWinner, side, team }: { isWinner: boolean; side: string; team?: TournamentTeam | null }) {
  const { t } = useTranslation()
  return (
    <div className={cn("p-5", isWinner && "bg-primary/[0.04]")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-12 rounded-lg">
            <AvatarImage src={team?.avatar ?? undefined} />
            <AvatarFallback className="rounded-lg">{teamName(team).slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">{side}</p>
            <h2 className="truncate font-heading text-2xl font-semibold">{teamName(team)}</h2>
          </div>
        </div>
        {isWinner ? (
          <Badge className="gap-1">
            <Trophy className="size-3.5" weight="bold" />
            {t("tournament.common.winner")}
          </Badge>
        ) : null}
      </div>

      {team?.players?.length ? (
        <div className="space-y-2">
          {team.players.map((player) => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">{t("tournament.match.slotUndecided")}</p>
      )}
    </div>
  )
}

function PlayerRow({ player }: { player: TournamentPlayer }) {
  const { t } = useTranslation()
  const name = player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.player")
  const avatar = player.avatar_snapshot ?? player.user?.avatar ?? undefined

  return (
    <Link
      className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 transition hover:border-primary/40"
      to={`/user/${player.user_id}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Avatar className="size-7">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">{name}</span>
      </span>
      {player.is_captain ? <Badge variant="outline">{t("tournament.common.captain")}</Badge> : null}
    </Link>
  )
}

function InfoPanel({ match, mpUrl }: { match: TournamentMatch; mpUrl: string | null }) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <FlagCheckered className="size-5 text-primary" weight="bold" />
        <h2 className="font-heading text-xl font-semibold">{t("tournament.match.info")}</h2>
      </div>

      <div className="space-y-4">
        <InfoLine icon={<CalendarDots className="size-4" />} label={t("tournament.common.scheduled")} value={formatDateTime(match.scheduled_time)} />
        <InfoLine icon={<DiceFive className="size-4" />} label={t("tournament.common.roll")} value={formatRoll(match)} />
        <InfoLine label={t("tournament.common.firstTo")} value={match.round?.first_to ? String(match.round.first_to) : "-"} />
        <InfoLine label={t("tournament.common.slot")} value={`#${match.slot_no ?? match.id}`} />
      </div>

      <Separator className="my-4" />

      {mpUrl ? (
        <Button asChild className="w-full justify-between" variant="outline">
          <a href={mpUrl} rel="noreferrer" target="_blank">
            {t("tournament.match.osuMultiplayer")}
            <ArrowSquareOut className="size-4" />
          </a>
        </Button>
      ) : (
        <AppAlert title={t("tournament.match.noMpTitle")}>{t("tournament.match.noMpDescription")}</AppAlert>
      )}
    </section>
  )
}

function InfoLine({ icon, label, value }: { icon?: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function GamesPanel({ games, team1, team2 }: { games: TournamentGame[]; team1?: TournamentTeam | null; team2?: TournamentTeam | null }) {
  const { t } = useTranslation()
  const sortedGames = [...games].sort((a, b) => a.order - b.order)

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t("tournament.match.playedMaps")}</p>
          <h2 className="font-heading text-xl font-semibold">{t("tournament.match.scoreHistory")}</h2>
        </div>
        <Badge variant="secondary">{t("tournament.common.maps", { count: sortedGames.length })}</Badge>
      </div>

      {sortedGames.length === 0 ? (
        <AppAlert title={t("tournament.match.noScoresTitle")}>{t("tournament.match.noScoresDescription")}</AppAlert>
      ) : (
        <div className="space-y-3">
          {sortedGames.map((game) => (
            <GameRow game={game} key={game.id} team1={team1} team2={team2} />
          ))}
        </div>
      )}
    </section>
  )
}

function GameRow({ game, team1, team2 }: { game: TournamentGame; team1?: TournamentTeam | null; team2?: TournamentTeam | null }) {
  const { t } = useTranslation()
  const team1Won = game.winner_team === 1
  const team2Won = game.winner_team === 2

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline">{game.map?.type ?? `#${game.order}`}</Badge>
            <span className="text-xs text-muted-foreground">{t("tournament.common.game", { order: game.order })}</span>
          </div>
          <p className="truncate font-medium">{mapTitle(game)}</p>
          {game.map?.mapper ? <p className="text-xs text-muted-foreground">{t("tournament.match.mappedBy", { mapper: game.map.mapper })}</p> : null}
        </div>
        {game.map?.map_id ? (
          <Button asChild size="sm" variant="ghost">
            <a href={`https://osu.ppy.sh/beatmaps/${game.map.map_id}`} rel="noreferrer" target="_blank">
              <ArrowSquareOut className="size-4" />
            </a>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <GameScore isWinner={team1Won} score={game.player1_score} teamName={teamName(team1)} />
        <GameScore isWinner={team2Won} score={game.player2_score} teamName={teamName(team2)} />
      </div>
    </div>
  )
}

function GameScore({ isWinner, score, teamName }: { isWinner: boolean; score: number; teamName: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2 text-sm", isWinner && "bg-primary/10 text-primary")}>
      <span className="truncate">{teamName}</span>
      <span className="font-semibold tabular-nums">{formatScore(score)}</span>
    </div>
  )
}

function teamName(team?: TournamentTeam | null) {
  return team?.display_name ?? team?.name ?? "TBD"
}

function mapTitle(game: TournamentGame) {
  if (!game.map) return `Map #${game.map_id}`
  return `${game.map.artist} - ${game.map.title}`
}

function groupLabel(group: string | null | undefined, t: TFunction) {
  if (group === "winner") return t("tournament.bracket.group.winner")
  if (group === "loser") return t("tournament.bracket.group.loser")
  if (group === "grand_final") return t("tournament.bracket.group.grand_final")
  if (group === "reset_final") return t("tournament.bracket.group.reset_final")
  return t("tournament.bracket.group.bracket")
}

function formatRoll(match: TournamentMatch) {
  if (match.team1_roll == null && match.team2_roll == null) return "-"
  return `${match.team1_roll ?? "-"} : ${match.team2_roll ?? "-"}`
}

function formatScore(score: number) {
  return new Intl.NumberFormat("en-US").format(score ?? 0)
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

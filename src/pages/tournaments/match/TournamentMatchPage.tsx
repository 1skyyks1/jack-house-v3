import type { ReactNode } from "react"
import {
  ArrowSquareOut,
  Star,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import {
  useTournamentDetailQuery,
  useTournamentMatchQuery,
  type TournamentGame,
  type TournamentMatch,
  type TournamentMappoolMap,
  type TournamentPlayer,
  type TournamentTeam,
} from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DetailPageSkeleton, AppAlert, getErrorMessage, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { TeamFlag } from "../_shared/TeamFlag"
import { getTournamentMapCoverUrl } from "../_shared/tournamentVisuals"
import { buildMappoolLabelMap, getMappoolLabel } from "../_shared/tournamentMappool"
import { formatTournamentScheduleTimeUtc } from "../_shared/tournamentScheduleTime"
import { getMainStageLabel, getMatchStage } from "../_shared/tournamentRoundStages"

export function TournamentMatchPage() {
  const { t } = useTranslation()
  const { matchId, tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const matchQuery = useTournamentMatchQuery(tid, matchId)

  if (tournamentQuery.isError || matchQuery.isError) {
    return <PageState title={t("tournament.match.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? matchQuery.error)} />
  }

  if (tournamentQuery.isLoading || matchQuery.isLoading || !matchQuery.data) {
    return <DetailPageSkeleton />
  }

  const tournament = tournamentQuery.data
  const match = matchQuery.data
  const title = formatRoundLabel(match)
  const mpUrl = match.mp_id ? `https://osu.ppy.sh/community/matches/${match.mp_id}` : null
  const defaultTeamAvatar = tournament?.default_team_avatar ?? null

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <TournamentBreadcrumb
        current={t("tournament.common.match", { id: match.id })}
        tournament={tournament}
        tournamentId={tid}
        trail={[{ label: t("tournament.common.schedule"), to: `/t/${tid}/bracket` }]}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-xl border bg-card p-4 sm:p-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)]">
            <TeamPanel align="left" defaultTeamAvatar={defaultTeamAvatar} side="Team Red" team={match.team1} />
            <MatchScore match={match} />
            <TeamPanel align="right" defaultTeamAvatar={defaultTeamAvatar} side="Team Blue" team={match.team2} />
          </div>
        </section>

        <InfoPanel match={match} roundLabel={title} />
      </section>
      {match.result_note ? <AppAlert title={t("tournament.match.resultNote")}>{match.result_note}</AppAlert> : null}
      <GamesPanel games={match.games ?? []} mappool={match.round?.mappool ?? []} mpUrl={mpUrl} team1={match.team1} team2={match.team2} />
    </main>
  )
}

function MatchScore({ match }: { match: TournamentMatch }) {
  const team1Won = match.winner_id === match.team1_id
  const team2Won = match.winner_id === match.team2_id
  return (
    <div className="flex flex-col items-center justify-center py-3 tabular-nums lg:py-0">
      <div className="flex items-center justify-center gap-2">
        <span className={cn("font-heading text-4xl font-semibold leading-none", team1Won && "text-primary")}>{match.team1_score ?? 0}</span>
        <span className="font-heading text-2xl text-muted-foreground">:</span>
        <span className={cn("font-heading text-4xl font-semibold leading-none", team2Won && "text-primary")}>{match.team2_score ?? 0}</span>
      </div>
      <span className="mt-1 text-xs font-medium text-muted-foreground">{formatBestOf(match.round?.first_to)}</span>
    </div>
  )
}

function TeamPanel({ align = "left", defaultTeamAvatar, side, team }: { align?: "left" | "right"; defaultTeamAvatar?: string | null; side: string; team?: TournamentTeam | null }) {
  const { t } = useTranslation()
  const isRightAligned = align === "right"
  return (
    <div className={cn("min-w-0", isRightAligned && "text-right")}>
      <div className={cn("mb-3 flex items-center gap-3", isRightAligned ? "justify-end" : "justify-start")}>
        <div className={cn("flex min-w-0 items-center gap-3", isRightAligned && "flex-row-reverse")}>
          <TeamFlag className="h-11 rounded-lg" name={teamName(team)} src={team?.avatar ?? defaultTeamAvatar} />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-muted-foreground">{side}</p>
            <h2 className="truncate font-heading text-2xl font-semibold">{teamName(team)}</h2>
          </div>
        </div>
      </div>

      {team?.players?.length ? (
        <div>
          {team.players.map((player) => (
            <PlayerRow align={align} key={player.id} player={player} />
          ))}
        </div>
      ) : (
        <p className="py-3 text-sm text-muted-foreground">{t("tournament.match.slotUndecided")}</p>
      )}
    </div>
  )
}

function PlayerRow({ align = "left", player }: { align?: "left" | "right"; player: TournamentPlayer }) {
  const { t } = useTranslation()
  const name = player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.player")
  const avatar = player.avatar_snapshot ?? player.user?.avatar ?? undefined
  const isRightAligned = align === "right"
  const captainIcon = player.is_captain ? <Star aria-label={t("tournament.common.captain")} className="size-3.5 shrink-0 text-amber-500" weight="fill" /> : null

  return (
    <Link
      className={cn("flex items-center gap-3 py-2 transition hover:text-primary", isRightAligned ? "justify-end" : "justify-start")}
      to={`/user/${player.user_id}`}
    >
      <span className={cn("flex min-w-0 items-center gap-2", isRightAligned && "flex-row-reverse")}>
        <Avatar className="size-7">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className={cn("flex min-w-0 items-center gap-1.5", isRightAligned && "flex-row-reverse")}>
          <span className="truncate text-sm font-medium">{name}</span>
          {captainIcon}
        </span>
      </span>
    </Link>
  )
}

function InfoPanel({ match, roundLabel }: { match: TournamentMatch; roundLabel: string }) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border bg-card p-4 sm:p-4">
      <div className="space-y-3">
        <InfoLine label={t("tournament.match.roundLabel")} value={roundLabel} />
        <InfoLine label={t("tournament.match.matchLabel")} value={`#${getMatchDisplayNumber(match)}`} />
        <InfoLine label={t("tournament.common.scheduled")} value={formatTournamentScheduleTimeUtc(match.scheduled_time)} />
        <InfoLine label={t("tournament.match.statusLabel")} value={match.status === 2 ? t("tournament.common.completed") : t("tournament.common.notStarted")} />
      </div>
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

function GamesPanel({ games, mappool, mpUrl, team1, team2 }: { games: TournamentGame[]; mappool: TournamentMappoolMap[]; mpUrl: string | null; team1?: TournamentTeam | null; team2?: TournamentTeam | null }) {
  const { t } = useTranslation()
  const sortedGames = [...games].sort((a, b) => a.order - b.order)
  const labelById = buildMappoolLabelMap(mappool)

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-semibold">{t("tournament.match.scoreHistory")}</h2>
        {mpUrl ? (
          <Button asChild size="sm" variant="outline">
            <a href={mpUrl} rel="noreferrer" target="_blank">
              {t("tournament.match.osuMultiplayer")}
              <ArrowSquareOut className="size-4" />
            </a>
          </Button>
        ) : null}
      </div>

      {sortedGames.length === 0 ? (
        <AppAlert title={t("tournament.match.noScoresTitle")}>{t("tournament.match.noScoresDescription")}</AppAlert>
      ) : (
        <div className="space-y-3">
          {sortedGames.map((game) => (
            <GameRow game={game} key={game.id} label={getMappoolLabel(game.map, labelById) || `#${game.order}`} team1={team1} team2={team2} />
          ))}
        </div>
      )}
    </section>
  )
}

function GameRow({ game, label, team1, team2 }: { game: TournamentGame; label: string; team1?: TournamentTeam | null; team2?: TournamentTeam | null }) {
  const team1Won = game.winner_team === 1
  const team2Won = game.winner_team === 2
  const coverUrl = getTournamentMapCoverUrl(game.map)

  return (
    <article className="grid overflow-hidden rounded-lg border bg-card md:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="relative min-h-32 overflow-hidden bg-muted text-white">
        {coverUrl ? (
          <img alt="" className="absolute inset-0 size-full object-cover" src={coverUrl} />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.36))]" />
        <div className="relative z-10 flex h-full min-h-32 flex-col justify-between p-3">
          <div className="flex items-center gap-2">
            <Badge className="border-white/20 bg-black/35 text-white" variant="outline">{label}</Badge>
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{mapTitle(game)}</p>
            {game.map?.mapper ? <p className="mt-1 text-xs text-white/72">mapped by {game.map.mapper}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center border-t bg-background p-3 md:border-l md:border-t-0">
        <div className="space-y-1">
          <GameScore isWinner={team1Won} player={game.player1} score={game.player1_score} teamName={teamName(team1)} />
          <GameScore isWinner={team2Won} player={game.player2} score={game.player2_score} teamName={teamName(team2)} />
        </div>
      </div>
    </article>
  )
}

function GameScore({ isWinner, player, score, teamName }: { isWinner: boolean; player?: TournamentPlayer | null; score: number; teamName: string }) {
  const name = playerName(player)
  const avatar = player?.avatar_snapshot ?? player?.user?.avatar ?? undefined

  return (
    <div className={cn("flex items-center justify-between gap-3 py-2 text-sm", isWinner && "font-semibold text-primary")}>
      <span className="flex min-w-0 items-center gap-2">
        <Avatar className="size-7">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate">{name}</span>
          <span className={cn("block truncate text-xs font-normal", isWinner ? "text-primary/75" : "text-muted-foreground")}>{teamName}</span>
        </span>
      </span>
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

function playerName(player?: TournamentPlayer | null) {
  return player?.user_name_snapshot ?? player?.user?.user_name ?? "TBD"
}

function formatRoundLabel(match: TournamentMatch) {
  const stageLabel = getMainStageLabel(getMatchStage(match))
  if (match.bracket_group === "winner" || match.round?.bracket_type === 0) return `${stageLabel} WB`
  if (match.bracket_group === "loser" || match.round?.bracket_type === 1) return `${stageLabel} LB`
  if (match.bracket_group === "grand_final") return `${stageLabel} GF`
  if (match.bracket_group === "reset_final") return `${stageLabel} GFR`
  return stageLabel
}

function formatBestOf(firstTo?: number | null) {
  return firstTo ? `BO${firstTo * 2 - 1}` : "BO-"
}

function getMatchDisplayNumber(match: TournamentMatch) {
  return getGeneratedBracketMatchNumber(match) ?? match.id
}

function getGeneratedBracketMatchNumber(match: TournamentMatch) {
  const slot = match.slot_no
  if (!slot || slot < 1) return null

  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "winner") {
    const offsets: Record<number, number> = {
      1: 0,
      2: 24,
      3: 44,
      4: 54,
      5: 59,
    }
    const offset = roundNo ? offsets[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }

  if (match.bracket_group === "loser") {
    const offsets: Record<number, number> = {
      1: 16,
      2: 32,
      3: 40,
      4: 48,
      5: 52,
      6: 56,
      7: 58,
      8: 60,
    }
    const offset = roundNo ? offsets[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }

  if (match.bracket_group === "grand_final") return 62
  if (match.bracket_group === "reset_final") return 63
  return null
}

function formatScore(score: number) {
  return new Intl.NumberFormat("en-US").format(score ?? 0)
}

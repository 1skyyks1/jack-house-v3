import type { MouseEvent as ReactMouseEvent } from "react"
import { Clock } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { TournamentMatch } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getMainStageLabel } from "../../_shared/tournamentRoundStages"
import { formatTournamentScheduleTimeUtc } from "../../_shared/tournamentScheduleTime"
import {
  createScheduleRoundJumpItems,
  getMatchNumber,
  scheduleRoundDomId,
  sourceLabel,
  type BracketRoundData,
  type MatchLookup,
} from "../model"

export function ScheduleRoundJumpNav({ rounds }: { rounds: BracketRoundData[] }) {
  const visibleRounds = createScheduleRoundJumpItems(rounds)
  if (visibleRounds.length <= 1) return null

  return (
    <nav className="-mx-1 mt-3 px-1 pb-1" aria-label="Schedule rounds">
      <div className="flex flex-wrap gap-2">
        {visibleRounds.map((round) => (
          <a
            className="shrink-0 whitespace-nowrap rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            href={`#${scheduleRoundDomId(round.targetKey)}`}
            key={round.key}
            onClick={(event) => handleScheduleRoundJump(event, round.targetKey)}
          >
            {round.label}
          </a>
        ))}
      </div>
    </nav>
  )
}

export function ScheduleView({
  matchLookup,
  matchNumbers,
  rounds,
  tournamentId,
}: {
  matchLookup: MatchLookup
  matchNumbers: Map<number, number>
  rounds: BracketRoundData[]
  tournamentId: string
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-3 sm:px-6 lg:px-8">
      {rounds.map((round) => (
        <ScheduleRound key={round.key} matchLookup={matchLookup} matchNumbers={matchNumbers} round={round} tournamentId={tournamentId} />
      ))}
    </div>
  )
}

function handleScheduleRoundJump(event: ReactMouseEvent<HTMLAnchorElement>, key: string) {
  event.preventDefault()
  const id = scheduleRoundDomId(key)
  const target = document.getElementById(id)
  if (!target) return
  window.history.replaceState(null, "", `#${id}`)
  target.scrollIntoView({ behavior: "smooth", block: "start" })
}

function ScheduleRound({ matchLookup, matchNumbers, round, tournamentId }: { matchLookup: MatchLookup; matchNumbers: Map<number, number>; round: BracketRoundData; tournamentId: string }) {
  const { t } = useTranslation()
  return (
    <section className="scroll-mt-54" id={scheduleRoundDomId(round.key)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b pb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{round.stage ? getMainStageLabel(round.stage) : t("tournament.common.round", { round: round.roundNo ?? "-" })}</p>
          <h2 className="mt-1 truncate font-heading text-2xl font-semibold">{round.name}</h2>
        </div>
        <Badge className="mb-1" variant="outline">{t("tournament.common.matches", { count: round.matches.length })}</Badge>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {round.matches.map((match) => (
          <ScheduleMatchCard key={match.id} match={match} matchLookup={matchLookup} matchNumber={matchNumbers.get(match.id) ?? 0} matchNumbers={matchNumbers} tournamentId={tournamentId} />
        ))}
      </div>
    </section>
  )
}

function ScheduleMatchCard({ match, matchLookup, matchNumber, matchNumbers, tournamentId }: { match: TournamentMatch; matchLookup: MatchLookup; matchNumber: number; matchNumbers: Map<number, number>; tournamentId: string }) {
  const { t } = useTranslation()
  const isComplete = match.status === 2
  const team1Name = match.team1?.display_name ?? sourceLabel(match, 1, matchLookup, matchNumbers)
  const team2Name = match.team2?.display_name ?? sourceLabel(match, 2, matchLookup, matchNumbers)

  return (
    <Link
      className={cn("block rounded-lg border bg-background p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md", isComplete && "border-primary/25")}
      to={`/t/${tournamentId}/match/${match.id}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t("tournament.common.match", { id: matchNumber || getMatchNumber(match, matchNumbers) })}</span>
        {match.scheduled_time ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {formatTournamentScheduleTimeUtc(match.scheduled_time)}
          </span>
        ) : null}
      </div>
      <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)]">
        <ScheduleTeamSide align="left" isWinner={match.winner_id === match.team1_id} name={team1Name} team={match.team1} />
        <div className="flex items-center justify-center gap-2">
          <span className={cn("font-heading text-2xl font-semibold tabular-nums", match.winner_id === match.team1_id && "text-primary")}>{match.team1_score ?? 0}</span>
          <span className="text-muted-foreground">:</span>
          <span className={cn("font-heading text-2xl font-semibold tabular-nums", match.winner_id === match.team2_id && "text-primary")}>{match.team2_score ?? 0}</span>
        </div>
        <ScheduleTeamSide align="right" isWinner={match.winner_id === match.team2_id} name={team2Name} team={match.team2} />
      </div>
    </Link>
  )
}

function ScheduleTeamSide({ align, isWinner, name, team }: { align: "left" | "right"; isWinner: boolean; name: string; team?: TournamentMatch["team1"] }) {
  const avatars = (team?.players ?? []).slice(0, 2)
  const avatarGroup = (
    <div className={cn("flex shrink-0 -space-x-2", align === "right" && "flex-row-reverse space-x-reverse")}>
      {avatars.map((player) => {
        const playerName = player.user_name_snapshot ?? player.user?.user_name ?? "?"
        return (
          <Avatar className="size-7 border-2 border-background" key={player.id}>
            <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
            <AvatarFallback>{playerName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )
      })}
    </div>
  )

  return (
    <div className={cn("flex min-w-0 items-center gap-2", align === "right" ? "justify-end text-right" : "justify-start", isWinner && "font-semibold text-primary")}>
      {align === "left" ? avatarGroup : null}
      <span className="truncate">{name}</span>
      {align === "right" ? avatarGroup : null}
    </div>
  )
}

import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { CheckCircle, Copy, Crown, LockKey, NotePencil, SignOut, Star, Trash } from "@phosphor-icons/react"
import type { TournamentPlayer, TournamentTeam } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { isPlayerCaptain, isTeamCaptain, isTeamMutable } from "./utils"

export function TeamSection({
  action,
  highlightedTeamId,
  myTeamId,
  onKick,
  onLeave,
  onEdit,
  onResetInvite,
  onSubmit,
  onTransferCaptain,
  registrationOpen,
  teams,
  userId,
}: {
  action?: (team: TournamentTeam) => ReactNode
  highlightedTeamId?: number | null
  myTeamId?: number
  onKick?: (team: TournamentTeam, player: TournamentPlayer) => void
  onLeave?: (team: TournamentTeam) => void
  onEdit?: (team: TournamentTeam) => void
  onResetInvite?: (teamId: number) => void
  onSubmit?: (teamId: number) => void
  onTransferCaptain?: (team: TournamentTeam) => void
  registrationOpen: boolean
  teams: TournamentTeam[]
  userId: number | null
}) {
  return (
    <section>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <TeamCard
            action={action}
            isHighlighted={highlightedTeamId === team.id}
            isMyTeam={myTeamId === team.id}
            key={team.id}
            onKick={onKick}
            onLeave={onLeave}
            onEdit={onEdit}
            onResetInvite={onResetInvite}
            onSubmit={onSubmit}
            onTransferCaptain={onTransferCaptain}
            registrationOpen={registrationOpen}
            team={team}
            userId={userId}
          />
        ))}
      </div>
    </section>
  )
}

function TeamCard({
  action,
  isHighlighted,
  isMyTeam,
  onKick,
  onLeave,
  onEdit,
  onResetInvite,
  onSubmit,
  onTransferCaptain,
  registrationOpen,
  team,
  userId,
}: {
  action?: (team: TournamentTeam) => ReactNode
  isHighlighted: boolean
  isMyTeam: boolean
  onKick?: (team: TournamentTeam, player: TournamentPlayer) => void
  onLeave?: (team: TournamentTeam) => void
  onEdit?: (team: TournamentTeam) => void
  onResetInvite?: (teamId: number) => void
  onSubmit?: (teamId: number) => void
  onTransferCaptain?: (team: TournamentTeam) => void
  registrationOpen: boolean
  team: TournamentTeam
  userId: number | null
}) {
  const { t } = useTranslation()
  const isCaptain = isTeamCaptain(team, userId)
  const isMutable = registrationOpen && isTeamMutable(team)
  const canTransferCaptain = isCaptain && isMutable && (team.players ?? []).some((player) => !isPlayerCaptain(team, player))
  const players = team.players ?? []
  const displayName = team.display_name || team.name
  const isPrivate = !team.is_open

  return (
    <article
      className={cn(
        "relative min-h-20 overflow-hidden rounded-lg border bg-card px-4 py-3 pr-28 shadow-sm transition hover:border-primary/30",
        isMyTeam && "border-primary/50 ring-1 ring-primary/20",
        isHighlighted && "border-primary ring-2 ring-primary/30",
      )}
      id={`team-card-${team.id}`}
    >
      <TeamAvatarPanel players={players} />
      <div className="relative z-10 flex min-h-14 min-w-0 flex-col justify-center gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isPrivate ? <LockKey className="size-4 shrink-0 text-muted-foreground" weight="bold" /> : null}
            <h3 className="truncate font-heading text-lg font-semibold leading-tight">{displayName}</h3>
          </div>
          {action ? <div className="shrink-0">{action(team)}</div> : null}
        </div>
        <div className="grid min-w-0 grid-cols-2 items-center gap-x-5 gap-y-2 overflow-hidden">
          {players.map((player) => (
            <div className="group flex min-w-0 shrink items-center gap-1" key={player.id}>
              <PlayerLink player={player} team={team} />
              {isCaptain && isMutable && !isPlayerCaptain(team, player) ? (
                <Button className="size-7 shrink-0 opacity-70 group-hover:opacity-100" onClick={() => onKick?.(team, player)} size="icon" variant="ghost">
                  <Trash className="size-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {isMyTeam ? (
        <div className="relative z-10 mt-4 flex flex-wrap gap-2 border-t pt-4">
          {isCaptain ? (
            <>
              <Button disabled={!isMutable} onClick={() => onSubmit?.(team.id)} size="sm" variant="outline">
                <CheckCircle className="size-4" weight="bold" />
                {t("tournament.common.submit")}
              </Button>
              <Button disabled={!isMutable} onClick={() => onEdit?.(team)} size="sm" variant="outline">
                <NotePencil className="size-4" weight="bold" />
                {t("tournament.common.edit")}
              </Button>
              <Button disabled={!canTransferCaptain} onClick={() => onTransferCaptain?.(team)} size="sm" variant="outline">
                <Crown className="size-4" weight="bold" />
                {t("tournament.common.transfer")}
              </Button>
              {!team.is_open ? (
                <Button disabled={!isMutable} onClick={() => onResetInvite?.(team.id)} size="sm" variant="outline">
                  <Copy className="size-4" weight="bold" />
                  {t("tournament.teams.resetInvite")}
                </Button>
              ) : null}
            </>
          ) : null}
          <Button disabled={!isMutable} onClick={() => onLeave?.(team)} size="sm" variant="outline">
            <SignOut className="size-4" weight="bold" />
            {t("tournament.common.leave")}
          </Button>
          {!isMutable ? <span className="flex items-center text-xs text-muted-foreground">{registrationOpen ? t("tournament.teams.lockedSubmitted") : t("tournament.teams.registrationClosed")}</span> : null}
        </div>
      ) : null}
    </article>
  )
}

function PlayerLink({ player, team }: { player: TournamentPlayer; team: TournamentTeam }) {
  const { t } = useTranslation()
  const name = player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.user", { id: player.user_id })

  return (
    <Link className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground" to={`/user/${player.user_id}`}>
      <span className="truncate">{name}</span>
      {isPlayerCaptain(team, player) ? <Star className="size-3.5 shrink-0 text-amber-500" weight="fill" /> : null}
    </Link>
  )
}

function TeamAvatarPanel({ players }: { players: TournamentPlayer[] }) {
  const displayPlayers = players.slice(0, 3)

  return (
      <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 flex w-28 items-center justify-end overflow-hidden bg-[linear-gradient(135deg,rgba(20,184,166,0.22),hsl(var(--muted)))] pl-9 pr-3 [clip-path:polygon(24%_0,100%_0,100%_100%,0_100%)] sm:w-32"
    >
      <div className="relative h-14 w-16">
        {displayPlayers.map((player, index) => {
          const name = player.user_name_snapshot ?? player.user?.user_name ?? "?"

          return (
            <Avatar
              className={cn(
                "absolute size-10 border-2 border-background shadow-md",
                index === 0 && "right-5 top-0",
                index === 1 && "right-0 top-4",
                index === 2 && "right-9 top-5 opacity-90",
              )}
              key={player.id}
            >
              <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
              <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          )
        })}
      </div>
    </div>
  )
}

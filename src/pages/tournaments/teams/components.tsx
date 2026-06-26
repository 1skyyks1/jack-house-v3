import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { CheckCircle, Copy, Crown, NotePencil, SignOut, Trash } from "@phosphor-icons/react"
import type { TournamentPlayer, TournamentTeam } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getTeamStatusLabel, isPlayerCaptain, isTeamCaptain, isTeamMutable } from "./utils"

export function TeamSection({
  action,
  myTeamId,
  onKick,
  onLeave,
  onEdit,
  onResetInvite,
  onSubmit,
  onTransferCaptain,
  registrationOpen,
  teams,
  title,
  userId,
}: {
  action?: (team: TournamentTeam) => ReactNode
  myTeamId?: number
  onKick?: (team: TournamentTeam, player: TournamentPlayer) => void
  onLeave?: (team: TournamentTeam) => void
  onEdit?: (team: TournamentTeam) => void
  onResetInvite?: (teamId: number) => void
  onSubmit?: (teamId: number) => void
  onTransferCaptain?: (team: TournamentTeam) => void
  registrationOpen: boolean
  teams: TournamentTeam[]
  title: string
  userId: number | null
}) {
  return (
    <section>
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <TeamCard
            action={action}
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

  return (
    <article className={cn("rounded-lg border bg-card p-4", isMyTeam && "border-primary/40")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-xl font-semibold">{team.display_name || team.name}</h3>
            <Badge variant="outline">{team.is_open ? t("tournament.teams.open") : t("tournament.teams.private")}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("tournament.common.captain")}: {team.captain?.user_name ?? "-"}</p>
        </div>
        {action ? action(team) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(team.players ?? []).map((player) => (
          <div className="group flex items-center gap-1" key={player.id}>
            <Link className="flex items-center gap-2 rounded-full border bg-background px-2 py-1 text-sm" to={`/user/${player.user_id}`}>
              <Avatar className="size-6">
                <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
                <AvatarFallback>{(player.user_name_snapshot ?? player.user?.user_name ?? "?").slice(0, 1)}</AvatarFallback>
              </Avatar>
              <span className="max-w-[10rem] truncate">{player.user_name_snapshot ?? player.user?.user_name ?? t("tournament.common.user", { id: player.user_id })}</span>
            </Link>
            {isCaptain && isMutable && !isPlayerCaptain(team, player) ? (
              <Button className="size-7 opacity-70 group-hover:opacity-100" onClick={() => onKick?.(team, player)} size="icon" variant="ghost">
                <Trash className="size-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className={cn("rounded-full bg-muted px-2 py-1", team.status === 1 && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}>
          {getTeamStatusLabel(team.status, t)}
        </span>
        {team.qual_rank ? <span className="rounded-full bg-muted px-2 py-1">{t("tournament.teams.qualifierRank", { rank: team.qual_rank })}</span> : null}
      </div>
      {isMyTeam ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
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

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl font-semibold">{value}</p>
    </div>
  )
}

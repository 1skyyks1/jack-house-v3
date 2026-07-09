import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Prohibit, ShieldCheck, Sword } from "@phosphor-icons/react"
import type { TournamentGame, TournamentMappoolMap, TournamentMatch, TournamentMatchAction, TournamentTeam } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { TeamFlag } from "../_shared/TeamFlag"
import { buildMappoolLabelMap, getMappoolLabel, sortMappoolMaps } from "../_shared/tournamentMappool"
import type { ActionType } from "./types"
import { isMapDisabled, normalizeActionType, teamName, teamNameById } from "./utils"

const actionIcons: Record<ActionType, ReactNode> = {
  ban: <Prohibit className="size-4" weight="bold" />,
  pick: <Sword className="size-4" weight="bold" />,
  protect: <ShieldCheck className="size-4" weight="bold" />,
}

const actionIconClassNames: Record<ActionType, string> = {
  ban: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  pick: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  protect: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

export function TeamCard({ align = "left", defaultTeamAvatar, team }: { align?: "left" | "right"; defaultTeamAvatar?: string | null; team?: TournamentTeam | null }) {
  const players = team?.players ?? []
  const isRightAligned = align === "right"

  return (
    <div className={cn("flex h-full min-w-0 items-center rounded-lg border bg-background px-3 py-2", isRightAligned ? "justify-end text-right" : "justify-start")}>
      <div className={cn("flex min-w-0 items-center gap-3", isRightAligned && "flex-row-reverse")}>
        <TeamFlag className="h-8" name={teamName(team)} src={team?.avatar ?? defaultTeamAvatar} />
        <div className={cn("flex min-w-0 flex-col", isRightAligned && "items-end")}>
          <h2 className="truncate font-heading text-lg font-semibold">{teamName(team)}</h2>
          <div className={cn("mt-1 flex min-w-0 flex-wrap items-center gap-2 overflow-hidden", isRightAligned && "justify-end")}>
            {players.map((player) => {
              const playerName = player.user_name_snapshot ?? player.user?.user_name ?? `#${player.user_id}`
              return (
                <div className={cn("flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground", isRightAligned && "flex-row-reverse")} key={player.id}>
                  <Avatar className="size-5 shrink-0">
                    <AvatarImage src={player.avatar_snapshot ?? player.user?.avatar ?? undefined} />
                    <AvatarFallback>{playerName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{playerName}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

export function ActionRow({
  action,
  actions,
  game,
  maps,
  match,
  onAutosave,
}: {
  action: TournamentMatchAction
  actions: TournamentMatchAction[]
  game?: TournamentGame
  maps: TournamentMappoolMap[]
  match: TournamentMatch
  onAutosave: (request: { action_type: ActionType; map_id: number; note?: string | null; team_id: number }) => void
}) {
  const { t } = useTranslation()
  const initialType = normalizeActionType(action.action_type)
  const [draft, setDraft] = useState({
    action_type: initialType,
    map_id: action.map_id ? String(action.map_id) : "",
    team_id: action.team_id ? String(action.team_id) : "",
  })
  const sortedMaps = sortMappoolMaps(maps)
  const mapLabelById = buildMappoolLabelMap(sortedMaps)

  function saveOnChange(nextDraft: typeof draft) {
    setDraft(nextDraft)
    if (!nextDraft.team_id || !nextDraft.map_id) return
    onAutosave({
      action_type: nextDraft.action_type,
      map_id: Number(nextDraft.map_id),
      note: null,
      team_id: Number(nextDraft.team_id),
    })
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(4.75rem,1fr)_minmax(3.75rem,0.8fr)_minmax(5.25rem,1.2fr)] items-center gap-1.5 border-b px-2 py-1 text-xs last:border-b-0">
      <p className="flex min-w-0 items-center gap-1.5 truncate font-medium">
        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded", actionIconClassNames[draft.action_type])}>{actionIcons[draft.action_type]}</span>
        <span className="truncate">{teamNameById(match, Number(draft.team_id))}</span>
      </p>
      <Select value={draft.action_type} onValueChange={(value) => saveOnChange({ ...draft, action_type: value as ActionType })}>
        <SelectTrigger size="xs" className="w-full min-w-0 [&>span]:truncate">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="protect">{t("tournament.referee.protect")}</SelectItem>
          <SelectItem value="ban">{t("tournament.referee.ban")}</SelectItem>
          <SelectItem value="pick">{t("tournament.referee.pick")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={draft.map_id} onValueChange={(value) => saveOnChange({ ...draft, map_id: value })}>
        <SelectTrigger size="xs" className="w-full min-w-0 [&>span]:truncate">
          <SelectValue placeholder={t("tournament.referee.selectMap")} />
        </SelectTrigger>
        <SelectContent>
          {sortedMaps.map((map) => (
            <SelectItem disabled={isMapDisabled(draft.action_type, map, actions, action.id)} key={map.id} value={String(map.id)}>
              {getMappoolLabel(map, mapLabelById)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ActionScore game={draft.action_type === "pick" ? game : undefined} match={match} />
    </div>
  )
}

function ActionScore({ game, match }: { game?: TournamentGame; match: TournamentMatch }) {
  if (!game) {
    return <span className="text-right text-muted-foreground">-</span>
  }

  const winner = game.winner_team === 1 ? teamName(match.team1) : game.winner_team === 2 ? teamName(match.team2) : "-"
  const team1Won = game.winner_team === 1
  const team2Won = game.winner_team === 2

  return (
    <span className="min-w-0 pr-1 text-right tabular-nums" title={winner}>
      <span className={cn("font-semibold", team1Won ? "text-primary" : "text-muted-foreground")}>{Number(game.player1_score || 0).toLocaleString()}</span>
      <span className="px-1 text-muted-foreground">:</span>
      <span className={cn("font-semibold", team2Won ? "text-primary" : "text-muted-foreground")}>{Number(game.player2_score || 0).toLocaleString()}</span>
    </span>
  )
}

export function CommandLine({ label, value }: { label: string; value?: string }) {
  const { t } = useTranslation()
  if (!value) return null

  return (
    <Button
      className="h-8 w-full min-w-0 justify-start gap-2 overflow-hidden rounded-lg px-2 text-left"
      variant="outline"
      size="sm"
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value)
        toast.success(t("tournament.referee.commandCopied"))
      }}
    >
      <span className="shrink-0 text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <code className="min-w-0 truncate text-xs">{value}</code>
    </Button>
  )
}

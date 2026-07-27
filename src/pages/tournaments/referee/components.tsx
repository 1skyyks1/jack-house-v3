import { useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Prohibit, ShieldCheck, Sword } from "@phosphor-icons/react"
import type { TournamentGame, TournamentMappoolMap, TournamentMatch, TournamentMatchAction, TournamentTeam, UpdateTournamentGameScoreRequest } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { TeamFlag } from "../_shared/TeamFlag"
import { buildMappoolLabelMap, getMappoolLabel, sortMappoolMaps } from "../_shared/tournamentMappool"
import type { ActionType } from "./types"
import { isAutomaticTiebreakerAction, isMapDisabled, normalizeActionType, teamName, teamNameById } from "./utils"

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
  onScoreSave,
}: {
  action: TournamentMatchAction
  actions: TournamentMatchAction[]
  game?: TournamentGame
  maps: TournamentMappoolMap[]
  match: TournamentMatch
  onAutosave: (request: { action_type: ActionType; map_id: number; note?: string | null; team_id: number }) => void
  onScoreSave: (gameId: number, request: UpdateTournamentGameScoreRequest) => Promise<void>
}) {
  const { t } = useTranslation()
  const initialType = normalizeActionType(action.action_type)
  const isAutomaticTiebreaker = isAutomaticTiebreakerAction(action)
  const [draft, setDraft] = useState({
    action_type: initialType,
    map_id: action.map_id ? String(action.map_id) : "",
    team_id: action.team_id ? String(action.team_id) : "",
  })
  const sortedMaps = sortMappoolMaps(maps)
  const mapLabelById = buildMappoolLabelMap(sortedMaps)

  function saveOnChange(nextDraft: typeof draft) {
    setDraft(nextDraft)
    if (isAutomaticTiebreaker || !nextDraft.team_id || !nextDraft.map_id) return
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
        <span className="truncate">{isAutomaticTiebreaker ? t("tournament.referee.automaticTiebreaker") : teamNameById(match, Number(draft.team_id))}</span>
      </p>
      <Select disabled={isAutomaticTiebreaker} value={draft.action_type} onValueChange={(value) => saveOnChange({ ...draft, action_type: value as ActionType })}>
        <SelectTrigger size="xs" className="w-full min-w-0 [&>span]:truncate">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="protect">{t("tournament.referee.protect")}</SelectItem>
          <SelectItem value="ban">{t("tournament.referee.ban")}</SelectItem>
          <SelectItem value="pick">{t("tournament.referee.pick")}</SelectItem>
        </SelectContent>
      </Select>
      <Select disabled={isAutomaticTiebreaker} value={draft.map_id} onValueChange={(value) => saveOnChange({ ...draft, map_id: value })}>
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
      <ActionScore game={draft.action_type === "pick" ? game : undefined} match={match} onSave={onScoreSave} />
    </div>
  )
}

function ActionScore({ game, match, onSave }: { game?: TournamentGame; match: TournamentMatch; onSave: (gameId: number, request: UpdateTournamentGameScoreRequest) => Promise<void> }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [player1Id, setPlayer1Id] = useState("")
  const [player2Id, setPlayer2Id] = useState("")
  const [team1Score, setTeam1Score] = useState("")
  const [team2Score, setTeam2Score] = useState("")
  const [saving, setSaving] = useState(false)

  if (!game) {
    return <span className="text-right text-muted-foreground">-</span>
  }

  const currentGame = game
  const winner = currentGame.winner_team === 1 ? teamName(match.team1) : currentGame.winner_team === 2 ? teamName(match.team2) : "-"
  const team1Won = currentGame.winner_team === 1
  const team2Won = currentGame.winner_team === 2
  const team1Players = match.team1?.players ?? []
  const team2Players = match.team2?.players ?? []
  const parsedTeam1Score = Number(team1Score)
  const parsedTeam2Score = Number(team2Score)
  const playerSelectionIsValid = (team1Players.length === 0 || Boolean(player1Id))
    && (team2Players.length === 0 || Boolean(player2Id))
  const scoreIsValid = playerSelectionIsValid
    && team1Score.trim() !== ""
    && team2Score.trim() !== ""
    && Number.isFinite(parsedTeam1Score)
    && Number.isFinite(parsedTeam2Score)
    && parsedTeam1Score >= 0
    && parsedTeam2Score >= 0
    && parsedTeam1Score !== parsedTeam2Score

  function handleOpenChange(nextOpen: boolean) {
    if (saving) return
    setOpen(nextOpen)
    if (nextOpen) {
      setPlayer1Id(resolvePlayerId(currentGame.player1_id, team1Players))
      setPlayer2Id(resolvePlayerId(currentGame.player2_id, team2Players))
      setTeam1Score(String(currentGame.player1_score ?? 0))
      setTeam2Score(String(currentGame.player2_score ?? 0))
    }
  }

  async function handleSave() {
    if (!scoreIsValid) return
    setSaving(true)
    try {
      await onSave(currentGame.id, {
        ...(player1Id ? { player1_id: Number(player1Id) } : {}),
        player1_score: Math.round(parsedTeam1Score),
        ...(player2Id ? { player2_id: Number(player2Id) } : {}),
        player2_score: Math.round(parsedTeam2Score),
      })
      setOpen(false)
      toast.success(t("tournament.referee.gameScoreSaved"))
    } catch {
      // The page-level mutation alert presents the API error while the editor stays open.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button className="h-7 min-w-0 justify-end px-1 text-right tabular-nums" title={`${winner} · ${t("tournament.common.edit")}`} type="button" variant="ghost">
          <span className={cn("font-semibold", team1Won ? "text-primary" : "text-muted-foreground")}>{Number(currentGame.player1_score || 0).toLocaleString()}</span>
          <span className="px-1 text-muted-foreground">:</span>
          <span className={cn("font-semibold", team2Won ? "text-primary" : "text-muted-foreground")}>{Number(currentGame.player2_score || 0).toLocaleString()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-3 rounded-lg p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
          <Label className="grid min-w-0 gap-1 text-xs">
            <span className="truncate">{teamName(match.team1)}</span>
            <Select disabled={saving || team1Players.length <= 1} value={player1Id} onValueChange={setPlayer1Id}>
              <SelectTrigger size="xs" className="w-full min-w-0 [&>span]:truncate">
                <SelectValue placeholder={t("tournament.common.player")} />
              </SelectTrigger>
              <SelectContent>
                {team1Players.map((player) => <SelectItem key={player.id} value={String(player.id)}>{tournamentPlayerName(player)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input aria-label={teamName(match.team1)} className="h-8 text-right tabular-nums" disabled={saving} inputMode="numeric" min={0} step={1} type="number" value={team1Score} onChange={(event) => setTeam1Score(event.target.value)} />
          </Label>
          <span className="pb-1.5 text-muted-foreground">:</span>
          <Label className="grid min-w-0 gap-1 text-xs">
            <span className="truncate">{teamName(match.team2)}</span>
            <Select disabled={saving || team2Players.length <= 1} value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger size="xs" className="w-full min-w-0 [&>span]:truncate">
                <SelectValue placeholder={t("tournament.common.player")} />
              </SelectTrigger>
              <SelectContent>
                {team2Players.map((player) => <SelectItem key={player.id} value={String(player.id)}>{tournamentPlayerName(player)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input aria-label={teamName(match.team2)} className="h-8 text-right tabular-nums" disabled={saving} inputMode="numeric" min={0} step={1} type="number" value={team2Score} onChange={(event) => setTeam2Score(event.target.value)} />
          </Label>
        </div>
        <div className="flex justify-end gap-2">
          <Button disabled={saving} size="sm" type="button" variant="outline" onClick={() => setOpen(false)}>{t("tournament.common.cancel")}</Button>
          <Button disabled={saving || !scoreIsValid} size="sm" type="button" onClick={() => void handleSave()}>{t("tournament.common.save")}</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function resolvePlayerId(currentPlayerId: number, players: NonNullable<TournamentTeam["players"]>) {
  if (currentPlayerId > 0 && players.some((player) => Number(player.id) === Number(currentPlayerId))) return String(currentPlayerId)
  return players.length === 1 ? String(players[0].id) : ""
}

function tournamentPlayerName(player: NonNullable<TournamentTeam["players"]>[number]) {
  return player.user_name_snapshot ?? player.user?.user_name ?? `#${player.user_id}`
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

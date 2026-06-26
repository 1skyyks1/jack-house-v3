import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Flag, ShieldCheck, Sword, Trophy } from "@phosphor-icons/react"
import type { TournamentMappoolMap, TournamentMatch, TournamentMatchAction, TournamentTeam } from "@/entities/tournament"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { ActionType } from "./types"
import { getActionNote, isMapDisabled, normalizeActionType, teamName, teamNameById } from "./utils"

const actionIcons: Record<ActionType, ReactNode> = {
  ban: <Flag className="size-4" weight="bold" />,
  pick: <Sword className="size-4" weight="bold" />,
  protect: <ShieldCheck className="size-4" weight="bold" />,
}

export function TeamCard({ isHighRoll, match, side, team }: { isHighRoll: boolean; match: TournamentMatch; side: string; team?: TournamentTeam | null }) {
  const { t } = useTranslation()
  return (
    <Card className={cn(isHighRoll && "ring-primary/40")} size="sm">
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar className="size-12 rounded-lg">
            <AvatarImage src={team?.avatar ?? undefined} />
            <AvatarFallback className="rounded-lg">{teamName(team).slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">{side}</p>
            <h2 className="truncate font-heading text-2xl font-semibold">{teamName(team)}</h2>
          </div>
          {isHighRoll ? <Badge className="gap-1"><Trophy className="size-3.5" weight="bold" />{t("tournament.common.highRoll")}</Badge> : null}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Info label={t("tournament.common.roll")} value={side === t("tournament.match.team", { index: 1 }) ? match.team1_roll : match.team2_roll} />
          <Info label={t("tournament.common.timeout")} value={side === t("tournament.match.team", { index: 1 }) ? (match.team1_timeout_used ? t("tournament.common.used") : t("tournament.common.ready")) : (match.team2_timeout_used ? t("tournament.common.used") : t("tournament.common.ready"))} />
          <Info label={t("tournament.common.score")} value={side === t("tournament.match.team", { index: 1 }) ? match.team1_score : match.team2_score} />
        </div>
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value?: number | string | null }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value ?? "-"}</p>
    </div>
  )
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function ActionRow({
  action,
  actions,
  maps,
  match,
  onAutosave,
}: {
  action: TournamentMatchAction
  actions: TournamentMatchAction[]
  maps: TournamentMappoolMap[]
  match: TournamentMatch
  onAutosave: (request: { action_type: ActionType; map_id: number; note?: string | null; team_id: number }) => void
}) {
  const { t } = useTranslation()
  const initialType = normalizeActionType(action.action_type)
  const [draft, setDraft] = useState({
    action_type: initialType,
    map_id: action.map_id ? String(action.map_id) : "",
    note: getActionNote(action),
    team_id: action.team_id ? String(action.team_id) : "",
  })
  const [saveState, setSaveState] = useState<"idle" | "queued" | "saved">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const actionLabel = t(`tournament.referee.${draft.action_type}`)

  function queueSave(nextDraft: typeof draft) {
    setDraft(nextDraft)
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!nextDraft.team_id || !nextDraft.map_id) {
      setSaveState("idle")
      return
    }

    setSaveState("queued")
    timerRef.current = setTimeout(() => {
      onAutosave({
        action_type: nextDraft.action_type,
        map_id: Number(nextDraft.map_id),
        note: nextDraft.note.trim() || null,
        team_id: Number(nextDraft.team_id),
      })
      setSaveState("saved")
    }, 2000)
  }

  return (
    <div className="grid gap-3 rounded-lg border bg-background px-3 py-3 lg:grid-cols-[minmax(10rem,1fr)_9rem_minmax(12rem,1.2fr)_minmax(10rem,1fr)_8rem]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">{actionIcons[draft.action_type]}</span>
        <div className="min-w-0">
          <p className="font-medium">#{action.sort_order} · {actionLabel}</p>
          <p className="truncate text-xs text-muted-foreground">{t("tournament.referee.autosaveHint")}</p>
        </div>
      </div>
      <Select value={draft.action_type} onValueChange={(value) => queueSave({ ...draft, action_type: value as ActionType })}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="protect">{t("tournament.referee.protect")}</SelectItem>
          <SelectItem value="ban">{t("tournament.referee.ban")}</SelectItem>
          <SelectItem value="pick">{t("tournament.referee.pick")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={draft.map_id} onValueChange={(value) => queueSave({ ...draft, map_id: value })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("tournament.referee.selectMap")} />
        </SelectTrigger>
        <SelectContent>
          {maps.map((map) => (
            <SelectItem disabled={isMapDisabled(draft.action_type, map, actions, action.id)} key={map.id} value={String(map.id)}>
              {map.type} · {map.artist} - {map.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={draft.team_id} onValueChange={(value) => queueSave({ ...draft, team_id: value })}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("tournament.referee.selectTeam")} />
        </SelectTrigger>
        <SelectContent>
          {match.team1_id ? <SelectItem value={String(match.team1_id)}>{teamName(match.team1)}</SelectItem> : null}
          {match.team2_id ? <SelectItem value={String(match.team2_id)}>{teamName(match.team2)}</SelectItem> : null}
        </SelectContent>
      </Select>
      <div className="grid gap-1">
        <Input
          aria-label={`${t("tournament.referee.action")} ${action.sort_order} ${t("tournament.referee.note")}`}
          placeholder={t("tournament.referee.note")}
          value={draft.note}
          onChange={(event) => queueSave({ ...draft, note: event.target.value })}
        />
        <span className="text-xs text-muted-foreground">
          {saveState === "queued" ? t("tournament.referee.savingSoon") : saveState === "saved" ? t("tournament.referee.saved") : teamNameById(match, Number(draft.team_id))}
        </span>
      </div>
    </div>
  )
}

export function CommandLine({ label, value }: { label: string; value?: string }) {
  const { t } = useTranslation()
  if (!value) return null

  return (
    <Button
      className="h-auto w-full justify-start rounded-lg px-3 py-2 text-left"
      variant="outline"
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value)
        toast.success(t("tournament.referee.commandCopied"))
      }}
    >
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <code className="break-all text-xs">{value}</code>
    </Button>
  )
}

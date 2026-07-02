import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowLeft, Check, ClipboardText, DiceFive, Sparkle, Timer } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import {
  useCreateTournamentMatchActionMutation,
  useRecordTournamentRollMutation,
  useRecordTournamentTimeoutMutation,
  useTournamentDetailQuery,
  useTournamentRefereeDataQuery,
  useUpdateTournamentMatchActionMutation,
  useUpdateTournamentGameScoreMutation,
  type TournamentGame,
} from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { ActionRow, CommandLine, Field, TeamCard } from "./components"
import type { ActionType } from "./types"
import { getHighRollTeamId, getNextAction, isMapDisabled, mapTitle, teamName, teamNameById } from "./utils"

export function TournamentRefereePage() {
  const { t } = useTranslation()
  const { matchId, tid } = useParams()
  const tournamentId = tid ?? ""
  const safeMatchId = matchId ?? ""
  const tournamentQuery = useTournamentDetailQuery(tid)
  const refereeQuery = useTournamentRefereeDataQuery(tid, matchId)
  const recordRollMutation = useRecordTournamentRollMutation(tournamentId, safeMatchId)
  const createActionMutation = useCreateTournamentMatchActionMutation(tournamentId, safeMatchId)
  const updateActionMutation = useUpdateTournamentMatchActionMutation(tournamentId, safeMatchId)
  const timeoutMutation = useRecordTournamentTimeoutMutation(tournamentId, safeMatchId)
  const updateGameMutation = useUpdateTournamentGameScoreMutation(tournamentId, safeMatchId)

  const match = refereeQuery.data?.match
  const [team1Roll, setTeam1Roll] = useState("")
  const [team2Roll, setTeam2Roll] = useState("")
  const [actionType, setActionType] = useState<ActionType>("protect")
  const [actionTeamId, setActionTeamId] = useState("")
  const [actionMapId, setActionMapId] = useState("")
  const [actionNote, setActionNote] = useState("")
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, { player1_score: string; player2_score: string }>>({})

  const mutationError = recordRollMutation.error ?? createActionMutation.error ?? updateActionMutation.error ?? timeoutMutation.error ?? updateGameMutation.error

  if (tournamentQuery.isError || refereeQuery.isError) {
    return <PageState title={t("tournament.referee.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? refereeQuery.error)} />
  }

  if (tournamentQuery.isLoading || refereeQuery.isLoading || !refereeQuery.data || !match) {
    return <PageState title={t("tournament.referee.loading")} description={t("tournament.referee.loadingDescription")} />
  }

  const actions = refereeQuery.data.actions ?? []
  const maps = match.round?.mappool ?? []
  const highRollTeamId = getHighRollTeamId(match)
  const nextAction = getNextAction(match, actions)
  const selectedActionType = actionType || nextAction.action_type
  const selectedActionTeamId = actionTeamId || (nextAction.team_id ? String(nextAction.team_id) : "") || (match.team1_id ? String(match.team1_id) : "")
  const team1RollValue = team1Roll || (match.team1_roll == null ? "" : String(match.team1_roll))
  const team2RollValue = team2Roll || (match.team2_roll == null ? "" : String(match.team2_roll))

  function handleRecordRoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    recordRollMutation.mutate(
      { team1_roll: Number(team1RollValue), team2_roll: Number(team2RollValue) },
      { onSuccess: () => toast.success(t("tournament.referee.rollSaved")) },
    )
  }

  function handleCreateAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedActionTeamId || !actionMapId) return

    createActionMutation.mutate(
      {
        action_type: selectedActionType,
        map_id: Number(actionMapId),
        note: actionNote.trim() || null,
        team_id: Number(selectedActionTeamId),
      },
      {
        onSuccess: () => {
          setActionMapId("")
          setActionNote("")
          toast.success(t("tournament.referee.actionSaved"))
        },
      },
    )
  }

  function handleSaveScore(game: TournamentGame) {
    const draft = scoreDrafts[game.id]
    updateGameMutation.mutate(
      {
        gameId: game.id,
        request: {
          player1_id: game.player1_id,
          player1_score: Number(draft?.player1_score ?? game.player1_score ?? 0),
          player2_id: game.player2_id,
          player2_score: Number(draft?.player2_score ?? game.player2_score ?? 0),
        },
      },
      { onSuccess: () => toast.success(t("tournament.referee.gameScoreSaved")) },
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild className="h-auto px-0 text-muted-foreground" variant="link">
            <Link to={`/t/${tid}/match/${match.id}`}>
              <ArrowLeft className="size-4" />
              {t("tournament.referee.backToMatch")}
            </Link>
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tournamentQuery.data?.name ?? t("tournament.common.tournament")}</p>
            <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{t("tournament.referee.title", { id: match.id })}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/t/${tid}/bracket`}>{t("tournament.common.bracket")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/admin/tournaments/${tournamentQuery.data?.id ?? tid}/bracket`}>{t("tournament.referee.adminMainStage")}</Link>
          </Button>
        </div>
      </div>

      {mutationError ? <MutationErrorAlert error={mutationError} title={t("tournament.referee.operationFailed")} /> : null}

      <section className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <TeamCard isHighRoll={highRollTeamId === match.team1_id} match={match} side={t("tournament.match.team", { index: 1 })} team={match.team1} />
        <div className="flex items-center justify-center">
          <div className="rounded-full border bg-card px-5 py-3 font-heading text-2xl font-semibold">
            {match.team1_score ?? 0}:{match.team2_score ?? 0}
          </div>
        </div>
        <TeamCard isHighRoll={highRollTeamId === match.team2_id} match={match} side={t("tournament.match.team", { index: 2 })} team={match.team2} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.referee.timeline")}</CardTitle>
              <CardAction>
                <Badge variant="outline">{t("tournament.common.actionCount", { count: actions.length })}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-primary/[0.04] px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkle className="size-4 text-primary" weight="bold" />
                  <span className="font-medium">{t("tournament.referee.nextAction")}</span>
                  <span className="text-muted-foreground">{nextAction.label}</span>
                </div>
                {nextAction.team_id ? <Badge variant="secondary">{teamNameById(match, nextAction.team_id)}</Badge> : <Badge variant="outline">{t("tournament.referee.waitingForRoll")}</Badge>}
              </div>
              <form className="mb-4 grid gap-3 lg:grid-cols-[8rem_minmax(10rem,1fr)_minmax(12rem,1fr)_minmax(12rem,1fr)_auto]" onSubmit={handleCreateAction}>
                <Field label={t("tournament.referee.action")}>
                  <Select value={selectedActionType} onValueChange={(value) => setActionType(value as ActionType)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protect">{t("tournament.referee.protect")}</SelectItem>
                      <SelectItem value="ban">{t("tournament.referee.ban")}</SelectItem>
                      <SelectItem value="pick">{t("tournament.referee.pick")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("tournament.referee.team")}>
                  <Select value={selectedActionTeamId} onValueChange={setActionTeamId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("tournament.referee.selectTeam")} />
                    </SelectTrigger>
                    <SelectContent>
                      {match.team1_id ? <SelectItem value={String(match.team1_id)}>{teamName(match.team1)}</SelectItem> : null}
                      {match.team2_id ? <SelectItem value={String(match.team2_id)}>{teamName(match.team2)}</SelectItem> : null}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("tournament.referee.map")}>
                  <Select value={actionMapId} onValueChange={setActionMapId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("tournament.referee.selectMap")} />
                    </SelectTrigger>
                    <SelectContent>
                      {maps.map((map) => (
                        <SelectItem disabled={isMapDisabled(selectedActionType, map, actions)} key={map.id} value={String(map.id)}>
                          {map.type} · {map.artist} - {map.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("tournament.referee.note")}>
                  <Input value={actionNote} onChange={(event) => setActionNote(event.target.value)} />
                </Field>
                <Button className="self-end" disabled={createActionMutation.isPending || !selectedActionTeamId || !actionMapId} type="submit">
                  <Check className="size-4" weight="bold" />
                  {t("tournament.common.save")}
                </Button>
              </form>

              {actions.length === 0 ? (
                <AppAlert title={t("tournament.referee.noActionsTitle")}>{t("tournament.referee.noActionsDescription")}</AppAlert>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <ActionRow
                      action={action}
                      actions={actions}
                      key={`${action.id}-${action.updated_time ?? ""}`}
                      maps={maps}
                      match={match}
                      onAutosave={(request) => updateActionMutation.mutate({ actionId: action.id, request })}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.referee.playedMapsCorrection")}</CardTitle>
              <CardAction>
                <Badge variant="outline">{t("tournament.common.games", { count: match.games?.length ?? 0 })}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {!match.games?.length ? (
                <AppAlert title={t("tournament.referee.noPlayedMapsTitle")}>{t("tournament.referee.noPlayedMapsDescription")}</AppAlert>
              ) : (
                <div className="space-y-3">
                  {match.games.map((game) => (
                    <div className="rounded-lg border bg-background p-3" key={game.id}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <Badge variant="outline">{game.map?.type ?? t("tournament.common.game", { order: game.order })}</Badge>
                          <p className="mt-1 truncate font-medium">{mapTitle(game.map)}</p>
                        </div>
                        <Badge variant={game.winner_team === 1 ? "default" : "secondary"}>{game.winner_team === 1 ? teamName(match.team1) : teamName(match.team2)}</Badge>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <Field label={teamName(match.team1)}>
                          <Input
                            type="number"
                            value={scoreDrafts[game.id]?.player1_score ?? String(game.player1_score ?? 0)}
                            onChange={(event) => setScoreDrafts((drafts) => ({ ...drafts, [game.id]: { ...(drafts[game.id] ?? { player2_score: "" }), player1_score: event.target.value } }))}
                          />
                        </Field>
                        <Field label={teamName(match.team2)}>
                          <Input
                            type="number"
                            value={scoreDrafts[game.id]?.player2_score ?? String(game.player2_score ?? 0)}
                            onChange={(event) => setScoreDrafts((drafts) => ({ ...drafts, [game.id]: { ...(drafts[game.id] ?? { player1_score: "" }), player2_score: event.target.value } }))}
                          />
                        </Field>
                        <Button className="self-end" disabled={updateGameMutation.isPending} type="button" onClick={() => handleSaveScore(game)}>{t("tournament.common.save")}</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.referee.rollAndTimeout")}</CardTitle>
              <CardAction>
                <DiceFive className="size-5 text-primary" weight="bold" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleRecordRoll}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={teamName(match.team1)}>
                    <Input required type="number" value={team1RollValue} onChange={(event) => setTeam1Roll(event.target.value)} />
                  </Field>
                  <Field label={teamName(match.team2)}>
                    <Input required type="number" value={team2RollValue} onChange={(event) => setTeam2Roll(event.target.value)} />
                  </Field>
                </div>
                <Button disabled={recordRollMutation.isPending} type="submit">{t("tournament.referee.saveRoll")}</Button>
              </form>
              <Separator className="my-4" />
              <div className="grid gap-2">
                <Button disabled={timeoutMutation.isPending || Boolean(match.team1_timeout_used)} type="button" variant="outline" onClick={() => timeoutMutation.mutate(1, { onSuccess: () => toast.success(t("tournament.referee.timeoutRecorded")) })}>
                  <Timer className="size-4" />
                  {t("tournament.referee.teamTimeout", { team: teamName(match.team1) })}
                </Button>
                <Button disabled={timeoutMutation.isPending || Boolean(match.team2_timeout_used)} type="button" variant="outline" onClick={() => timeoutMutation.mutate(2, { onSuccess: () => toast.success(t("tournament.referee.timeoutRecorded")) })}>
                  <Timer className="size-4" />
                  {t("tournament.referee.teamTimeout", { team: teamName(match.team2) })}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.referee.osuCommands")}</CardTitle>
              <CardAction>
                <ClipboardText className="size-5 text-primary" weight="bold" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <CommandLine label={t("tournament.referee.createRoom")} value={refereeQuery.data.roomName ? refereeQuery.data.commands.createRoom : undefined} />
                <CommandLine label={t("tournament.referee.settings")} value={refereeQuery.data.commands.settings} />
                <CommandLine label={t("tournament.referee.timer")} value={refereeQuery.data.commands.timer} />
                <CommandLine label={t("tournament.referee.start")} value={refereeQuery.data.commands.start} />
                <CommandLine label={t("tournament.referee.abort")} value={refereeQuery.data.commands.abort} />
                <CommandLine label={t("tournament.referee.close")} value={refereeQuery.data.commands.close} />
              </div>
              {refereeQuery.data.commands.invite?.length ? (
                <>
                  <Separator className="my-4" />
                  <Textarea readOnly className="font-mono text-xs" value={refereeQuery.data.commands.invite.join("\n")} />
                </>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}

import type { FormEvent } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowLeft, Check, DownloadSimple, Prohibit, ShieldCheck, Sparkle, Sword, Timer } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import {
  useCreateTournamentMatchActionMutation,
  useFetchTournamentMatchScoresMutation,
  useRecordTournamentRollMutation,
  useRecordTournamentTimeoutMutation,
  useTournamentDetailQuery,
  useTournamentRefereeDataQuery,
  useUpdateTournamentMatchMutation,
  useUpdateTournamentMatchActionMutation,
  type TournamentMappoolMap,
  type TournamentGame,
  type TournamentMatch,
  type TournamentMatchAction,
} from "@/entities/tournament"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageSkeleton, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { buildMappoolLabelMap, getMappoolLabel, sortMappoolMaps } from "../_shared/tournamentMappool"
import { getMatchStage } from "../_shared/tournamentRoundStages"
import { ActionRow, CommandLine, TeamCard } from "./components"
import type { ActionType } from "./types"
import { getNextAction, getRollWinnerTeamId, isAutomaticTiebreakerAction, isMapDisabled, teamName, teamNameById } from "./utils"

export function TournamentRefereePage() {
  const { t } = useTranslation()
  const { matchId, tid } = useParams()
  const tournamentId = tid ?? ""
  const safeMatchId = matchId ?? ""
  const tournamentQuery = useTournamentDetailQuery(tid)
  const refereeQuery = useTournamentRefereeDataQuery(tid, matchId)
  const recordRollMutation = useRecordTournamentRollMutation(tournamentId, safeMatchId)
  const createActionMutation = useCreateTournamentMatchActionMutation(tournamentId, safeMatchId)
  const fetchScoresMutation = useFetchTournamentMatchScoresMutation(tournamentId)
  const updateActionMutation = useUpdateTournamentMatchActionMutation(tournamentId, safeMatchId)
  const updateMatchMutation = useUpdateTournamentMatchMutation(tournamentId)
  const timeoutMutation = useRecordTournamentTimeoutMutation(tournamentId, safeMatchId)

  const match = refereeQuery.data?.match
  const [rollWinnerTeamId, setRollWinnerTeamId] = useState("")
  const [actionMapId, setActionMapId] = useState("")
  const [wbdWinnerTeamId, setWbdWinnerTeamId] = useState("")
  const [mpLinkDraft, setMpLinkDraft] = useState<{ key: string; value: string } | null>(null)

  const mutationError = recordRollMutation.error ?? createActionMutation.error ?? fetchScoresMutation.error ?? updateActionMutation.error ?? updateMatchMutation.error ?? timeoutMutation.error
  const mpLinkKey = `${match?.id ?? safeMatchId}:${match?.mp_id ?? ""}`
  const mpLink = mpLinkDraft?.key === mpLinkKey
    ? mpLinkDraft.value
    : match?.mp_id ? formatMpLink(match.mp_id) : ""

  if (tournamentQuery.isError || refereeQuery.isError) {
    return <PageState title={t("tournament.referee.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? refereeQuery.error)} />
  }

  if (tournamentQuery.isLoading || refereeQuery.isLoading || !refereeQuery.data || !match) {
    return <PageSkeleton />
  }

  const actions = refereeQuery.data.actions ?? []
  const games = match.games ?? []
  const gameByMapId = buildGameByMapId(games)
  const maps = sortMappoolMaps(match.round?.mappool ?? [])
  const mapLabelById = buildMappoolLabelMap(maps)
  const savedRollWinnerTeamId = getRollWinnerTeamId(match)
  const nextAction = getNextAction(match, actions)
  const selectedActionType = nextAction.action_type
  const selectedActionTeamId = nextAction.team_id ? String(nextAction.team_id) : ""
  const rollWinnerValue = rollWinnerTeamId || (savedRollWinnerTeamId ? String(savedRollWinnerTeamId) : "")
  const adminBracketStage = getMatchStage(match)
  const wbdWinner = Number(wbdWinnerTeamId) === Number(match.team1_id) ? match.team1 : Number(wbdWinnerTeamId) === Number(match.team2_id) ? match.team2 : null
  const wbdFirstTo = getWbdFirstTo(match)
  const isTiebreaker = wbdFirstTo > 1 && Number(match.team1_score) === wbdFirstTo - 1 && Number(match.team2_score) === wbdFirstTo - 1
  const hasAutomaticTiebreaker = actions.some(isAutomaticTiebreakerAction)
  const actionEntryDisabled = match.status === 2 || isTiebreaker || hasAutomaticTiebreaker

  function handleCreateAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedActionTeamId || !actionMapId) return

    createActionMutation.mutate(
      {
        action_type: selectedActionType,
        map_id: Number(actionMapId),
        note: null,
        team_id: Number(selectedActionTeamId),
      },
      {
        onSuccess: () => {
          setActionMapId("")
          toast.success(t("tournament.referee.actionSaved"))
        },
      },
    )
  }

  async function handleFetchScores(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!match) return
    const mpId = parseMpId(mpLink)
    if (!mpId) {
      toast.warning(t("tournament.referee.mpLinkInvalid"))
      return
    }

    if (mpId !== Number(match.mp_id)) {
      await updateMatchMutation.mutateAsync({
        matchId: match.id,
        request: { mp_id: mpId },
      })
    }

    await fetchScoresMutation.mutateAsync(match.id)
    toast.success(t("tournament.referee.scoresImported"))
  }

  return (
    <main className="flex h-[calc(100dvh-65px)] w-full max-w-full flex-col overflow-hidden p-1 sm:p-2">
      <header className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild size="sm" variant="outline">
            <Link to={`/t/${tid}/match/${match.id}`}>
              <ArrowLeft className="size-4" />
              {t("tournament.referee.backToMatch")}
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xl font-semibold">{t("tournament.referee.title", { id: match.id })}</h1>
            <p className="truncate text-xs text-muted-foreground">{formatRefereeSubtitle(match, t("tournament.referee.noRound"))}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/t/${tid}/bracket`}>{t("tournament.common.schedule")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/admin/tournaments/${tournamentQuery.data?.id ?? tid}/bracket${adminBracketStage ? `#${adminBracketStage}` : ""}`}>
              {t("tournament.referee.adminMainStage")}
            </Link>
          </Button>
        </div>
      </header>

      {mutationError ? <MutationErrorAlert error={mutationError} title={t("tournament.referee.operationFailed")} /> : null}

      <section className="grid shrink-0 items-stretch gap-2 lg:grid-cols-[minmax(0,1fr)_8rem_minmax(0,1fr)]">
        <TeamCard align="right" defaultTeamAvatar={tournamentQuery.data?.default_team_avatar} team={match.team1} />
        <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-2 py-1.5 text-center">
          <p className="flex items-center justify-center gap-2 font-heading text-3xl font-semibold leading-none tabular-nums">
            <span>{match.team1_score ?? 0}</span>
            <span className="text-muted-foreground">:</span>
            <span>{match.team2_score ?? 0}</span>
          </p>
          <Badge className="mt-1 h-4 px-1.5 text-[10px]" variant={match.status === 2 ? "default" : "outline"}>
            {match.status === 2 ? t("tournament.common.done") : match.status === 1 ? t("tournament.referee.inProgress") : t("tournament.teams.open")}
          </Badge>
        </div>
        <TeamCard align="left" defaultTeamAvatar={tournamentQuery.data?.default_team_avatar} team={match.team2} />
      </section>

      <section className="mt-2 grid min-h-0 flex-1 gap-2 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <div className="min-h-0 min-w-0">
          <Card className="h-full min-h-0 [--card-spacing:--spacing(1.5)]" size="sm">
            <CardContent className="flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2 pt-1">
              <form className="grid shrink-0 min-w-0 items-center gap-2 xl:grid-cols-[minmax(0,1fr)_5rem_auto]" onSubmit={handleCreateAction}>
                <p className="flex min-w-0 items-center gap-1.5 truncate border-l-2 border-primary bg-primary/[0.04] px-2 py-1.5 text-xs font-medium">
                  <Sparkle className="size-3.5 shrink-0 text-primary" weight="bold" />
                  <span className="truncate">{isTiebreaker || hasAutomaticTiebreaker ? t("tournament.referee.tiebreakerAutoSelected") : formatNextAction(nextAction, match, t(`tournament.referee.next.${nextAction.labelKey}`), t("tournament.referee.selectRollWinnerFirst"))}</span>
                </p>
                <Select disabled={actionEntryDisabled} value={actionMapId} onValueChange={setActionMapId}>
                  <SelectTrigger size="xs" className="w-full min-w-0 [&>span]:truncate">
                    <SelectValue placeholder={t("tournament.referee.selectMap")} />
                  </SelectTrigger>
                  <SelectContent>
                    {maps.map((map) => (
                      <SelectItem disabled={isMapDisabled(selectedActionType, map, actions)} key={map.id} value={String(map.id)}>
                        {getMappoolLabel(map, mapLabelById)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="h-7 whitespace-nowrap px-2 text-xs" disabled={actionEntryDisabled || createActionMutation.isPending || !selectedActionTeamId || !actionMapId} size="sm" type="submit">
                  <Check className="size-4" weight="bold" />
                  {t("tournament.referee.saveAction")}
                </Button>
              </form>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {actions.length === 0 ? (
                  <AppAlert title={t("tournament.referee.noActionsTitle")}>{t("tournament.referee.noActionsDescription")}</AppAlert>
                ) : (
                  <div className="w-full overflow-hidden rounded-md border">
                    {actions.map((action) => (
                      <ActionRow
                        action={action}
                        actions={actions}
                        game={action.map_id ? gameByMapId.get(Number(action.map_id)) : undefined}
                        key={`${action.id}-${action.updated_time ?? ""}`}
                        maps={maps}
                        match={match}
                        onAutosave={(request) => updateActionMutation.mutate({ actionId: action.id, request })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="grid min-h-0 min-w-0 gap-2 xl:grid-rows-[auto_minmax(0,1fr)]">
          <div className="grid min-h-0 min-w-0 gap-2 lg:grid-cols-[minmax(0,4fr)_minmax(0,3fr)]">
            <Card className="min-w-0 [--card-spacing:--spacing(1.5)]" size="sm">
              <CardContent className="px-2 pb-2 pt-1">
                <div className="space-y-1.5">
                  <CommandLine label={t("tournament.referee.scoreReport")} value={refereeQuery.data.commands.scoreReport} />
                  <CommandLine label={t("tournament.referee.createRoom")} value={refereeQuery.data.commands.createRoom} />
                  <CommandLine label={t("tournament.referee.settings")} value={refereeQuery.data.commands.settings} />
                  {refereeQuery.data.commands.invite?.map((command) => (
                    <CommandLine key={command} label={t("tournament.referee.invitePlayers")} value={command} />
                  ))}
                  <CommandLine label={t("tournament.referee.notifyPlayers")} value={refereeQuery.data.commands.notify} />
                  <CommandLine label={t("tournament.referee.close")} value={refereeQuery.data.commands.close} />
                </div>
              </CardContent>
            </Card>

            <Card className="min-h-0 [--card-spacing:--spacing(1.5)]" size="sm">
              <CardContent className="space-y-3 px-2 pb-2 pt-1">
                <form className="flex items-center justify-between gap-3" onSubmit={handleFetchScores}>
                  <span className="shrink-0 text-xs font-medium">{t("tournament.referee.mpLink")}</span>
                  <div className="flex min-w-0 flex-1 justify-end gap-1.5">
                    <Input
                      className="h-7 min-w-0 max-w-56 flex-1 text-xs"
                      inputMode="url"
                      placeholder={t("tournament.referee.mpLinkPlaceholder")}
                      value={mpLink}
                      onChange={(event) => setMpLinkDraft({ key: mpLinkKey, value: event.target.value })}
                    />
                    <Button
                      className="h-7 whitespace-nowrap px-2 text-xs"
                      disabled={fetchScoresMutation.isPending || updateMatchMutation.isPending || !parseMpId(mpLink)}
                      size="sm"
                      type="submit"
                    >
                      <DownloadSimple className="size-4" weight="bold" />
                      {t("tournament.referee.fetchScores")}
                    </Button>
                  </div>
                </form>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs font-medium">{t("tournament.referee.rollWinner")}</span>
                  <div className="w-32 min-w-0">
                    <Select
                      disabled={recordRollMutation.isPending}
                      value={rollWinnerValue}
                      onValueChange={(value) => {
                        setRollWinnerTeamId(value)
                        recordRollMutation.mutate(
                          { winner_team_id: Number(value) },
                          { onSuccess: () => toast.success(t("tournament.referee.rollSaved")) },
                        )
                      }}
                    >
                      <SelectTrigger size="xs" className="w-full [&>span]:truncate">
                        <SelectValue placeholder={t("tournament.referee.selectRollWinner")} />
                      </SelectTrigger>
                      <SelectContent>
                        {match.team1_id ? <SelectItem value={String(match.team1_id)}>{teamName(match.team1)}</SelectItem> : null}
                        {match.team2_id ? <SelectItem value={String(match.team2_id)}>{teamName(match.team2)}</SelectItem> : null}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs font-medium">{t("tournament.common.timeout")}</span>
                  <div className="grid min-w-0 max-w-64 flex-1 grid-cols-2 gap-1.5">
                    <Button className="h-7 min-w-0 px-2 text-xs" disabled={timeoutMutation.isPending || Boolean(match.team1_timeout_used)} size="sm" type="button" variant="outline" onClick={() => timeoutMutation.mutate(1, { onSuccess: () => toast.success(t("tournament.referee.timeoutRecorded")) })}>
                      <Timer className="size-3.5 shrink-0" />
                      <span className="truncate">{teamName(match.team1)}</span>
                    </Button>
                    <Button className="h-7 min-w-0 px-2 text-xs" disabled={timeoutMutation.isPending || Boolean(match.team2_timeout_used)} size="sm" type="button" variant="outline" onClick={() => timeoutMutation.mutate(2, { onSuccess: () => toast.success(t("tournament.referee.timeoutRecorded")) })}>
                      <Timer className="size-3.5 shrink-0" />
                      <span className="truncate">{teamName(match.team2)}</span>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs font-medium">{t("tournament.referee.wbdWinner")}</span>
                  <div className="flex min-w-0 max-w-64 flex-1 justify-end gap-1.5">
                    <Select disabled={updateMatchMutation.isPending} value={wbdWinnerTeamId} onValueChange={setWbdWinnerTeamId}>
                      <SelectTrigger size="xs" className="min-w-0 flex-1 [&>span]:truncate">
                        <SelectValue placeholder={t("tournament.referee.selectWbdWinner")} />
                      </SelectTrigger>
                      <SelectContent>
                        {match.team1_id ? <SelectItem value={String(match.team1_id)}>{teamName(match.team1)}</SelectItem> : null}
                        {match.team2_id ? <SelectItem value={String(match.team2_id)}>{teamName(match.team2)}</SelectItem> : null}
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="h-7 whitespace-nowrap px-2 text-xs" disabled={updateMatchMutation.isPending || !wbdWinner} size="sm" type="button" variant="outline">
                          {t("tournament.referee.setWbd")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("tournament.referee.confirmWbdTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("tournament.referee.confirmWbdDescription", { score: wbdFirstTo, team: teamName(wbdWinner) })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={updateMatchMutation.isPending}>{t("tournament.common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            disabled={updateMatchMutation.isPending || !wbdWinner}
                            onClick={() => updateMatchMutation.mutate(
                              {
                                matchId: match.id,
                                request: {
                                  result_type: "wbd",
                                  winner_id: Number(wbdWinnerTeamId),
                                  winner_overridden: 1,
                                },
                              },
                              {
                                onSuccess: () => {
                                  setWbdWinnerTeamId("")
                                  toast.success(t("tournament.referee.wbdRecorded"))
                                },
                              },
                            )}
                          >
                            {t("tournament.referee.confirmWbd")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="min-h-0 [--card-spacing:--spacing(1.5)]" size="sm">
            <CardContent className="min-h-0 flex-1 overflow-hidden px-2 pb-2 pt-1">
              {maps.length === 0 ? (
                <AppAlert title={t("tournament.qualifier.noMaps")} />
              ) : (
                <MappoolStatusTable actions={actions} labelById={mapLabelById} maps={maps} />
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}

function formatRefereeSubtitle(match: TournamentMatch, fallbackRound: string) {
  const roundName = match.round?.name ?? fallbackRound
  return `${roundName} · ${teamName(match.team1)} vs ${teamName(match.team2)}`
}

function formatNextAction(nextAction: ReturnType<typeof getNextAction>, match: TournamentMatch, label: string, fallback: string) {
  return nextAction.team_id ? `${label} · ${teamNameById(match, nextAction.team_id)}` : fallback
}

function getWbdFirstTo(match: TournamentMatch) {
  const stage = getMatchStage(match)
  if (stage === "ro32" || stage === "ro16") return 5
  if (stage === "qf" || stage === "sf") return 6
  if (stage === "f" || stage === "gf") return 7
  return Number(match.round?.first_to) || 0
}

function MappoolStatusTable({ actions, labelById, maps }: { actions: TournamentMatchAction[]; labelById: Map<number, string>; maps: TournamentMappoolMap[] }) {
  const { t } = useTranslation()

  return (
    <div className="h-full min-h-0 overflow-auto">
      <table className="w-full table-fixed text-xs">
        <tbody className="divide-y">
        {maps.map((map) => {
          const mapActions = actions.filter((item) => Number(item.map_id) === Number(map.id))
          const isProtected = mapActions.some((item) => item.action_type === "protect")
          const action = [...mapActions].reverse().find((item) => item.action_type === "ban" || item.action_type === "pick")
          const actionType = action?.action_type === "ban" || action?.action_type === "pick" ? action.action_type : null
          const StatusIcon = actionType === "ban" ? Prohibit : actionType === "pick" ? Sword : null

          return (
            <tr className={cn(
              actionType === "ban" && "bg-rose-500/5 text-muted-foreground",
              actionType === "pick" && "bg-sky-500/5",
            )} key={map.id}>
              <td className="w-14 px-2 py-1.5 align-middle">
                <span className="block text-center font-mono text-[11px] font-semibold text-muted-foreground">{getMappoolLabel(map, labelById)}</span>
              </td>
              <td className="min-w-0 px-2 py-1.5 align-middle">
                <p className={cn("truncate font-medium", actionType === "ban" ? "line-through decoration-muted-foreground/70" : null)}>
                  {map.artist} - {map.title}
                </p>
              </td>
              <td className="w-24 px-2 py-1.5 align-middle">
                <span className={cn("inline-flex w-full items-center justify-end gap-1 font-medium", mapStatusClass(actionType))}>
                  {isProtected ? <ShieldCheck className="size-3.5 text-emerald-700 dark:text-emerald-300" weight="bold" /> : null}
                  {StatusIcon ? <StatusIcon className="size-3.5" weight="bold" /> : null}
                  {actionType ? t(`tournament.referee.${actionType}`) : isProtected ? null : t("tournament.referee.unused")}
                </span>
              </td>
            </tr>
          )
        })}
        </tbody>
      </table>
    </div>
  )
}

function mapStatusClass(actionType: ActionType | null) {
  if (actionType === "protect") return "text-emerald-700 dark:text-emerald-300"
  if (actionType === "ban") return "text-rose-700 dark:text-rose-300"
  if (actionType === "pick") return "text-sky-700 dark:text-sky-300"
  return "text-muted-foreground"
}

function parseMpId(value: string) {
  const match = value.trim().match(/(?:osu\.ppy\.sh\/(?:mp|community\/matches)\/)?(\d{5,})/)
  return match ? Number(match[1]) : null
}

function formatMpLink(mpId: number) {
  return `https://osu.ppy.sh/mp/${mpId}`
}

function buildGameByMapId(games: TournamentGame[]) {
  const gameByMapId = new Map<number, TournamentGame>()
  for (const game of games) {
    if (!game.map_id) continue
    gameByMapId.set(Number(game.map_id), game)
  }
  return gameByMapId
}

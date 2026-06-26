import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowSquareOut, BracketsCurly, CalendarPlus, FlagCheckered, ListPlus, Plus, Trophy } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import {
  useCreateTournamentMatchMutation,
  useCreateTournamentRoundMapMutation,
  useCreateTournamentRoundMutation,
  useDeleteTournamentRoundMapMutation,
  useDeleteTournamentRoundMutation,
  useFetchTournamentMatchScoresMutation,
  useGenerateTournamentBracketMutation,
  useTournamentBracketQuery,
  useTournamentDetailQuery,
  useTournamentRoundMappoolQuery,
  useTournamentRoundsQuery,
  useTournamentTeamsQuery,
  useUpdateTournamentMatchMutation,
  useUpdateTournamentRoundMutation,
  type TournamentMatch,
  type TournamentRound,
  type TournamentTeam,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { Field, MapRow, MetricCard, RoundsCard, TeamSelect } from "./components"
import { defaultMapForm, defaultMatchForm, defaultRoundForm, MAIN_STAGE_MAP_TYPES, type MapFormState, type MatchFormState, type MatchUpdateState, type RoundFormState } from "./model"
import { groupLabel, teamName } from "./utils"

export function AdminTournamentBracketPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentId = tid ?? ""
  const [selectedRoundId, setSelectedRoundId] = useState<number | undefined>()
  const [selectedMatchId, setSelectedMatchId] = useState<number | undefined>()
  const [roundForm, setRoundForm] = useState<RoundFormState>(defaultRoundForm)
  const [mapForm, setMapForm] = useState<MapFormState>(defaultMapForm)
  const [matchForm, setMatchForm] = useState<MatchFormState>(defaultMatchForm)
  const [matchUpdate, setMatchUpdate] = useState<MatchUpdateState>({
    mp_id: "",
    result_note: "",
    result_type: "normal",
    status: "0",
    team1_score: "0",
    team2_score: "0",
    winner_id: "none",
  })

  const tournamentQuery = useTournamentDetailQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const bracketQuery = useTournamentBracketQuery(tid)
  const teamsQuery = useTournamentTeamsQuery(tid)

  const rounds = useMemo(() => [...(roundsQuery.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [roundsQuery.data])
  const matches = bracketQuery.data ?? []
  const teams = teamsQuery.data ?? []
  const selectedRound = rounds.find((round) => round.id === selectedRoundId) ?? rounds[0]
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? matches[0]
  const mappoolQuery = useTournamentRoundMappoolQuery(tid, selectedRound?.id)

  const createRoundMutation = useCreateTournamentRoundMutation(tournamentId)
  const updateRoundMutation = useUpdateTournamentRoundMutation(tournamentId)
  const deleteRoundMutation = useDeleteTournamentRoundMutation(tournamentId)
  const createMapMutation = useCreateTournamentRoundMapMutation(tournamentId)
  const deleteMapMutation = useDeleteTournamentRoundMapMutation(tournamentId)
  const generateBracketMutation = useGenerateTournamentBracketMutation(tournamentId)
  const createMatchMutation = useCreateTournamentMatchMutation(tournamentId)
  const updateMatchMutation = useUpdateTournamentMatchMutation(tournamentId)
  const fetchMatchScoresMutation = useFetchTournamentMatchScoresMutation(tournamentId)

  const mutationError = createRoundMutation.error
    ?? updateRoundMutation.error
    ?? deleteRoundMutation.error
    ?? createMapMutation.error
    ?? deleteMapMutation.error
    ?? generateBracketMutation.error
    ?? createMatchMutation.error
    ?? updateMatchMutation.error
    ?? fetchMatchScoresMutation.error

  if (tournamentQuery.isError || roundsQuery.isError || bracketQuery.isError || teamsQuery.isError || mappoolQuery.isError) {
    return (
      <PageState
        title={t("tournament.admin.bracket.loadFailed")}
        description={getErrorMessage(tournamentQuery.error ?? roundsQuery.error ?? bracketQuery.error ?? teamsQuery.error ?? mappoolQuery.error)}
      />
    )
  }

  function handleCreateRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createRoundMutation.mutate(
      {
        bracket_type: Number(roundForm.bracket_type),
        first_to: Number(roundForm.first_to),
        name: roundForm.name.trim(),
        order: roundForm.order ? Number(roundForm.order) : null,
      },
      {
        onSuccess: (round) => {
          setRoundForm(defaultRoundForm)
          setSelectedRoundId(round.id)
          toast.success(t("tournament.admin.bracket.roundCreated"))
        },
      },
    )
  }

  function handleUpdateRound(round: TournamentRound) {
    updateRoundMutation.mutate(
      {
        request: {
          bracket_type: round.bracket_type,
          first_to: round.first_to,
          name: round.name,
          order: round.order ?? null,
        },
        roundId: round.id,
      },
      { onSuccess: () => toast.success(t("tournament.admin.bracket.roundSaved")) },
    )
  }

  function handleCreateMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRound) return

    createMapMutation.mutate(
      {
        request: {
          artist: mapForm.artist.trim(),
          map_id: Number(mapForm.map_id),
          mapper: mapForm.mapper.trim(),
          title: mapForm.title.trim(),
          type: mapForm.type.trim().toUpperCase(),
        },
        roundId: selectedRound.id,
      },
      {
        onSuccess: () => {
          setMapForm(defaultMapForm)
          toast.success(t("tournament.admin.bracket.roundMapAdded"))
        },
      },
    )
  }

  function handleCreateMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMatchMutation.mutate(
      {
        is_possible: Number(matchForm.is_possible),
        round_id: Number(matchForm.round_id),
        scheduled_time: matchForm.scheduled_time ? new Date(matchForm.scheduled_time).toISOString() : null,
        team1_id: matchForm.team1_id === "none" ? null : Number(matchForm.team1_id),
        team2_id: matchForm.team2_id === "none" ? null : Number(matchForm.team2_id),
      },
      {
        onSuccess: (match) => {
          setMatchForm(defaultMatchForm)
          setSelectedMatchId(match.id)
          toast.success(t("tournament.admin.bracket.matchCreated"))
        },
      },
    )
  }

  function handleSaveMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedMatch) return

    updateMatchMutation.mutate(
      {
        matchId: selectedMatch.id,
        request: {
          mp_id: matchUpdate.mp_id ? Number(matchUpdate.mp_id) : null,
          result_note: matchUpdate.result_note.trim() || null,
          result_type: matchUpdate.result_type,
          status: Number(matchUpdate.status),
          team1_score: Number(matchUpdate.team1_score),
          team2_score: Number(matchUpdate.team2_score),
          winner_id: matchUpdate.winner_id === "none" ? null : Number(matchUpdate.winner_id),
          winner_overridden: matchUpdate.winner_id === "none" ? 0 : 1,
        },
      },
      { onSuccess: () => toast.success(t("tournament.admin.bracket.matchUpdated")) },
    )
  }

  function loadMatchForEdit(match: TournamentMatch) {
    setSelectedMatchId(match.id)
    setMatchUpdate({
      mp_id: match.mp_id ? String(match.mp_id) : "",
      result_note: match.result_note ?? "",
      result_type: match.result_type === "wbd" || match.result_type === "ff" ? match.result_type : "normal",
      status: String(match.status ?? 0),
      team1_score: String(match.team1_score ?? 0),
      team2_score: String(match.team2_score ?? 0),
      winner_id: match.winner_id ? String(match.winner_id) : "none",
    })
  }

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/tournaments">{t("tournament.admin.common.back")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/t/${tournamentQuery.data?.acronym || tournamentId}/bracket`}>{t("tournament.admin.bracket.publicBracket")}</Link>
          </Button>
          <Button
            disabled={generateBracketMutation.isPending}
            size="sm"
            type="button"
            onClick={() => generateBracketMutation.mutate(undefined, { onSuccess: () => toast.success(t("tournament.admin.bracket.bracketGenerated")) })}
          >
            <BracketsCurly className="size-4" weight="bold" />
            {t("tournament.admin.bracket.generateBracket")}
          </Button>
        </>
      )}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<ListPlus className="size-4" />} label={t("tournament.admin.bracket.rounds")} value={rounds.length} />
        <MetricCard icon={<FlagCheckered className="size-4" />} label={t("tournament.admin.bracket.matches")} value={matches.length} />
        <MetricCard icon={<Trophy className="size-4" />} label={t("tournament.admin.bracket.completed")} value={matches.filter((match) => match.status === 2).length} />
        <MetricCard icon={<CalendarPlus className="size-4" />} label={t("tournament.common.teams")} value={teams.length} />
      </div>

      {mutationError ? <MutationErrorAlert error={mutationError} title={t("tournament.admin.bracket.operationFailed")} /> : null}

      {!tournamentQuery.data?.qual_locked_at ? (
        <AppAlert title={t("tournament.admin.bracket.rankingNotLocked")}>{t("tournament.admin.bracket.lockedRequiredDescription")}</AppAlert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-4">
          <RoundsCard
            isCreating={createRoundMutation.isPending}
            onCreateRound={handleCreateRound}
            onDeleteRound={(roundId) => deleteRoundMutation.mutate(roundId, { onSuccess: () => toast.success(t("tournament.admin.bracket.roundDeleted")) })}
            onSelectRound={setSelectedRoundId}
            onUpdateRound={handleUpdateRound}
            roundForm={roundForm}
            rounds={rounds}
            setRoundForm={setRoundForm}
          />

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.admin.bracket.matches")}</CardTitle>
              <CardAction>
                <Badge variant="outline">{t("tournament.common.matches", { count: matches.length })}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <form className="mb-4 grid gap-3 lg:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_12rem_auto]" onSubmit={handleCreateMatch}>
                <Field label={t("tournament.common.round", { round: "" }).trim()}>
                  <Select required value={matchForm.round_id} onValueChange={(value) => setMatchForm((state) => ({ ...state, round_id: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("tournament.admin.bracket.selectRound")} />
                    </SelectTrigger>
                    <SelectContent>
                      {rounds.map((round) => <SelectItem key={round.id} value={String(round.id)}>{round.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("tournament.match.team", { index: 1 })}>
                  <TeamSelect teams={teams} value={matchForm.team1_id} onChange={(value) => setMatchForm((state) => ({ ...state, team1_id: value }))} />
                </Field>
                <Field label={t("tournament.match.team", { index: 2 })}>
                  <TeamSelect teams={teams} value={matchForm.team2_id} onChange={(value) => setMatchForm((state) => ({ ...state, team2_id: value }))} />
                </Field>
                <Field label={t("tournament.admin.bracket.schedule")}>
                  <Input type="datetime-local" value={matchForm.scheduled_time} onChange={(event) => setMatchForm((state) => ({ ...state, scheduled_time: event.target.value }))} />
                </Field>
                <Button className="self-end" disabled={createMatchMutation.isPending || !matchForm.round_id} type="submit">
                  <Plus className="size-4" weight="bold" />
                  {t("tournament.admin.bracket.addMatch")}
                </Button>
              </form>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">ID</TableHead>
                      <TableHead>{t("tournament.common.round", { round: "" }).trim()}</TableHead>
                      <TableHead>{t("tournament.common.teams")}</TableHead>
                      <TableHead>{t("tournament.common.score")}</TableHead>
                      <TableHead>{t("tournament.admin.list.status")}</TableHead>
                      <TableHead className="text-right">{t("tournament.admin.common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches.length === 0 ? (
                      <TableRow>
                        <TableCell className="py-8 text-center text-muted-foreground" colSpan={6}>{t("tournament.admin.bracket.noMatches")}</TableCell>
                      </TableRow>
                    ) : matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>#{match.id}</TableCell>
                        <TableCell>
                          <p className="font-medium">{match.round?.name ?? `Round ${match.round_id}`}</p>
                          <p className="text-xs text-muted-foreground">{groupLabel(match.bracket_group)} · slot {match.slot_no ?? "-"}</p>
                        </TableCell>
                        <TableCell>{teamName(match.team1)} vs {teamName(match.team2)}</TableCell>
                        <TableCell>{match.team1_score ?? 0}:{match.team2_score ?? 0}</TableCell>
	                        <TableCell><Badge variant={match.status === 2 ? "default" : "outline"}>{match.status === 2 ? t("tournament.common.done") : t("tournament.teams.open")}</Badge></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
	                            <Button size="sm" type="button" variant="outline" onClick={() => loadMatchForEdit(match)}>{t("tournament.common.edit")}</Button>
                            <Button asChild size="sm" type="button" variant="ghost">
	                              <Link to={`/t/${tournamentQuery.data?.acronym || tournamentId}/referee/${match.id}`}>{t("tournament.admin.bracket.referee")}</Link>
                            </Button>
                            <Button asChild size="sm" type="button" variant="ghost">
                              <Link to={`/t/${tournamentQuery.data?.acronym || tournamentId}/match/${match.id}`}>
                                <ArrowSquareOut className="size-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card size="sm">
            <CardHeader className="border-b">
	              <CardTitle>{t("tournament.qualifier.mappool")}</CardTitle>
              <CardAction>
	                <Badge variant="outline">{selectedRound?.name ?? t("tournament.admin.bracket.noRound")}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {!selectedRound ? (
	                <AppAlert title={t("tournament.admin.bracket.createRoundFirstTitle")}>{t("tournament.admin.bracket.createRoundFirstDescription")}</AppAlert>
              ) : (
                <>
                  <form className="grid gap-3" onSubmit={handleCreateMap}>
	                    <Field label={t("tournament.admin.bracket.mapType")}>
                      <Select value={mapForm.type} onValueChange={(value) => setMapForm((state) => ({ ...state, type: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_STAGE_MAP_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
	                    <Field label={t("tournament.admin.bracket.beatmapId")}>
                      <Input min={1} required type="number" value={mapForm.map_id} onChange={(event) => setMapForm((state) => ({ ...state, map_id: event.target.value }))} />
                    </Field>
	                    <Field label={t("tournament.admin.bracket.artist")}>
                      <Input required value={mapForm.artist} onChange={(event) => setMapForm((state) => ({ ...state, artist: event.target.value }))} />
                    </Field>
	                    <Field label={t("tournament.admin.bracket.title")}>
                      <Input required value={mapForm.title} onChange={(event) => setMapForm((state) => ({ ...state, title: event.target.value }))} />
                    </Field>
	                    <Field label={t("tournament.admin.bracket.mapper")}>
                      <Input required value={mapForm.mapper} onChange={(event) => setMapForm((state) => ({ ...state, mapper: event.target.value }))} />
                    </Field>
                    <Button disabled={createMapMutation.isPending} type="submit">
                      <Plus className="size-4" weight="bold" />
	                      {t("tournament.admin.bracket.addMap")}
                    </Button>
                  </form>
                  <div className="mt-4 space-y-2">
                    {(mappoolQuery.data ?? []).map((map) => (
                      <MapRow
                        key={map.id}
                        map={map}
	                        onDelete={() => deleteMapMutation.mutate({ mapId: map.id, roundId: selectedRound.id }, { onSuccess: () => toast.success(t("tournament.admin.bracket.roundMapDeleted")) })}
                      />
                    ))}
                    {!mappoolQuery.isLoading && (mappoolQuery.data ?? []).length === 0 ? (
	                      <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">{t("tournament.admin.bracket.noMapsInRound")}</p>
                    ) : null}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
	              <CardTitle>{t("tournament.admin.bracket.matchEditor")}</CardTitle>
              <CardAction>
	                <Badge variant="outline">{selectedMatch ? `#${selectedMatch.id}` : t("tournament.admin.bracket.noMatch")}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              {!selectedMatch ? (
	                <AppAlert title={t("tournament.admin.bracket.selectMatchTitle")}>{t("tournament.admin.bracket.selectMatchDescription")}</AppAlert>
              ) : (
                <form className="grid gap-3" onSubmit={handleSaveMatch}>
                  <Field label="MP ID">
                    <Input type="number" value={matchUpdate.mp_id} onChange={(event) => setMatchUpdate((state) => ({ ...state, mp_id: event.target.value }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={teamName(selectedMatch.team1)}>
                      <Input required type="number" value={matchUpdate.team1_score} onChange={(event) => setMatchUpdate((state) => ({ ...state, team1_score: event.target.value }))} />
                    </Field>
                    <Field label={teamName(selectedMatch.team2)}>
                      <Input required type="number" value={matchUpdate.team2_score} onChange={(event) => setMatchUpdate((state) => ({ ...state, team2_score: event.target.value }))} />
                    </Field>
                  </div>
	                  <Field label={t("tournament.admin.bracket.winner")}>
                    <TeamSelect
                      teams={[selectedMatch.team1, selectedMatch.team2].filter(Boolean) as TournamentTeam[]}
                      value={matchUpdate.winner_id}
                      onChange={(value) => setMatchUpdate((state) => ({ ...state, winner_id: value }))}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
	                    <Field label={t("tournament.admin.list.status")}>
                      <Select value={matchUpdate.status} onValueChange={(value) => setMatchUpdate((state) => ({ ...state, status: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
	                          <SelectItem value="0">{t("tournament.common.notStarted")}</SelectItem>
	                          <SelectItem value="1">{t("tournament.admin.bracket.legacyLive")}</SelectItem>
	                          <SelectItem value="2">{t("tournament.common.completed")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
	                    <Field label={t("tournament.admin.bracket.result")}>
                      <Select value={matchUpdate.result_type} onValueChange={(value) => setMatchUpdate((state) => ({ ...state, result_type: value as MatchUpdateState["result_type"] }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
	                          <SelectItem value="normal">{t("tournament.admin.bracket.normalResult")}</SelectItem>
                          <SelectItem value="wbd">{t("tournament.admin.bracket.wbdResult")}</SelectItem>
                          <SelectItem value="ff">{t("tournament.admin.bracket.ffResult")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
	                  <Field label={t("tournament.admin.bracket.resultNote")}>
                    <Textarea value={matchUpdate.result_note} onChange={(event) => setMatchUpdate((state) => ({ ...state, result_note: event.target.value }))} />
                  </Field>
                  <div className="flex flex-wrap gap-2">
	                    <Button disabled={updateMatchMutation.isPending} type="submit">{t("tournament.admin.bracket.saveMatch")}</Button>
                    <Button
                      disabled={fetchMatchScoresMutation.isPending || !selectedMatch.mp_id}
                      type="button"
                      variant="outline"
	                      onClick={() => fetchMatchScoresMutation.mutate(selectedMatch.id, { onSuccess: () => toast.success(t("tournament.admin.bracket.scoresImported")) })}
                    >
	                      {t("tournament.admin.bracket.importMpScores")}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </AdminPage>
  )
}

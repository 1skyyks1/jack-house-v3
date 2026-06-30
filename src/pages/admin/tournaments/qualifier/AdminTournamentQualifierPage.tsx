import type { FormEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Calculator, CheckCircle, DownloadSimple, ListNumbers, Plus, Trophy } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import {
  useCalculateTournamentQualRankingMutation,
  useCreateTournamentQualMapMutation,
  useFetchTournamentQualScoresMutation,
  useLockTournamentQualRankingMutation,
  useTournamentDetailQuery,
  useTournamentQualImportsQuery,
  useTournamentQualMappoolQuery,
  useTournamentQualRankingQuery,
  useTournamentQualScoresQuery,
  useTournamentTeamsQuery,
  useUpdateTournamentQualScoreMutation,
  type TournamentQualScore,
  type TournamentTeam,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

const importStatusVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  failed: "destructive",
  running: "secondary",
  success: "default",
}

const emptyScores: TournamentQualScore[] = []
const allTeamsValue = "__all__"

function parseMpIds(value: string) {
  return Array.from(new Set((value.match(/\d{5,}/g) ?? []).map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0)))
}

export function AdminTournamentQualifierPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentId = tid ?? ""
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [mpId, setMpId] = useState("")
  const [mapIndex, setMapIndex] = useState("")
  const [mapUrl, setMapUrl] = useState("")
  const [mapWeight, setMapWeight] = useState("1")
  const [selectedScoreId, setSelectedScoreId] = useState("")
  const [manualScore, setManualScore] = useState("")

  const tournamentQuery = useTournamentDetailQuery(tid)
  const teamsQuery = useTournamentTeamsQuery(tid)
  const mappoolQuery = useTournamentQualMappoolQuery(tid)
  const rankingQuery = useTournamentQualRankingQuery(tid)
  const scoresQuery = useTournamentQualScoresQuery(tid)
  const importsQuery = useTournamentQualImportsQuery(tid, 1, 20)

  const createMapMutation = useCreateTournamentQualMapMutation(tournamentId)
  const fetchScoresMutation = useFetchTournamentQualScoresMutation(tournamentId)
  const calculateRankingMutation = useCalculateTournamentQualRankingMutation(tournamentId)
  const lockRankingMutation = useLockTournamentQualRankingMutation(tournamentId)
  const updateScoreMutation = useUpdateTournamentQualScoreMutation(tournamentId)

  const teams = teamsQuery.data ?? []
  const mappool = mappoolQuery.data ?? []
  const ranking = rankingQuery.data ?? []
  const scores = scoresQuery.data ?? emptyScores
  const imports = importsQuery.data?.rows ?? []
  const isQualifierLocked = Boolean(tournamentQuery.data?.qual_locked_at)
  const selectedScore = useMemo(
    () => scores.find((score) => String(score.id) === selectedScoreId),
    [scores, selectedScoreId],
  )

  if (tournamentQuery.isError || teamsQuery.isError || mappoolQuery.isError || rankingQuery.isError || scoresQuery.isError || importsQuery.isError) {
    return (
      <PageState
        title={t("tournament.admin.qualifier.loadFailed")}
        description={getErrorMessage(tournamentQuery.error ?? teamsQuery.error ?? mappoolQuery.error ?? rankingQuery.error ?? scoresQuery.error ?? importsQuery.error)}
      />
    )
  }

  function handleCreateMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const index = Number(mapIndex)
    const weight = Number(mapWeight)

    createMapMutation.mutate(
      { index, url: mapUrl.trim(), weight: Number.isFinite(weight) ? weight : undefined },
      {
        onSuccess: () => {
          setMapIndex("")
          setMapUrl("")
          setMapWeight("1")
          toast.success(t("tournament.admin.qualifier.mapAdded"))
        },
      },
    )
  }

  function handleFetchScores(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selectedTeam = selectedTeamId && selectedTeamId !== allTeamsValue ? Number(selectedTeamId) : undefined
    const mpIds = parseMpIds(mpId)

    if (mpIds.length === 0) {
      toast.warning(t("tournament.admin.qualifier.mpIdRequired"))
      return
    }

    fetchScoresMutation.mutate(
      { ...(mpIds.length === 1 ? { mp_id: mpIds[0] } : { mp_ids: mpIds }), team_id: selectedTeam },
      {
        onSuccess: () => {
          setMpId("")
          toast.success(mpIds.length > 1 ? t("tournament.admin.qualifier.batchScoresImported", { count: mpIds.length }) : selectedTeam ? t("tournament.admin.qualifier.scoresImported") : t("tournament.admin.qualifier.detectedScoresImported"))
        },
      },
    )
  }

  function handleUpdateScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedScore) return

    updateScoreMutation.mutate(
      { request: { score: Number(manualScore) }, scoreId: selectedScore.id },
      {
        onSuccess: () => {
          setManualScore("")
          toast.success(t("tournament.admin.qualifier.scoreUpdated"))
        },
      },
    )
  }

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/tournaments">{t("tournament.admin.common.back")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/t/${tournamentQuery.data?.acronym || tournamentId}/qualifier`}>{t("tournament.admin.qualifier.publicQualifier")}</Link>
          </Button>
          <Button
            disabled={calculateRankingMutation.isPending || isQualifierLocked}
            size="sm"
            type="button"
            onClick={() => calculateRankingMutation.mutate(undefined, { onSuccess: () => toast.success(t("tournament.admin.qualifier.rankingRecalculated")) })}
          >
            <Calculator className="size-4" weight="bold" />
            {t("tournament.admin.qualifier.recalculateRanking")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={lockRankingMutation.isPending || isQualifierLocked} size="sm" type="button" variant={isQualifierLocked ? "outline" : "default"}>
                <Trophy className="size-4" weight="bold" />
                {isQualifierLocked ? t("tournament.admin.qualifier.rankingLockedButton") : t("tournament.admin.qualifier.lockRanking")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("tournament.admin.qualifier.lockTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("tournament.admin.qualifier.lockDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => lockRankingMutation.mutate(undefined, { onSuccess: () => toast.success(t("tournament.admin.qualifier.rankingLocked")) })}
                >
                  {t("tournament.admin.qualifier.lockRanking")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<ListNumbers className="size-4" />} label={t("tournament.admin.qualifier.qualifierMaps")} value={mappool.length} />
        <MetricCard icon={<Trophy className="size-4" />} label={t("tournament.admin.qualifier.rankedTeams")} value={ranking.length} />
        <MetricCard icon={<DownloadSimple className="size-4" />} label={t("tournament.admin.qualifier.importLogs")} value={importsQuery.data?.total ?? 0} />
        <MetricCard icon={<CheckCircle className="size-4" />} label={t("tournament.admin.qualifier.rawScores")} value={scores.length} />
      </div>

      {isQualifierLocked ? (
        <AppAlert title={t("tournament.admin.qualifier.lockedTitle")}>{t("tournament.admin.qualifier.lockedDescription", { date: formatDate(tournamentQuery.data?.qual_locked_at), top: tournamentQuery.data?.qual_locked_top_n ?? tournamentQuery.data?.qual_top_n ?? 32 })}</AppAlert>
      ) : (
        <AppAlert title={t("tournament.admin.qualifier.lockBeforeMainStage")}>{t("tournament.admin.qualifier.lockBeforeMainStageDescription")}</AppAlert>
      )}

      {(createMapMutation.isError || fetchScoresMutation.isError || calculateRankingMutation.isError || lockRankingMutation.isError || updateScoreMutation.isError) ? (
        <MutationErrorAlert
          error={createMapMutation.error ?? fetchScoresMutation.error ?? calculateRankingMutation.error ?? lockRankingMutation.error ?? updateScoreMutation.error}
          title={t("tournament.admin.qualifier.operationFailed")}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.qualifier.mappool")}</CardTitle>
              <CardAction>
                <Badge variant="outline">{t("tournament.common.maps", { count: mappool.length })}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <form className="mb-4 grid gap-3 lg:grid-cols-[7rem_minmax(16rem,1fr)_7rem_auto]" onSubmit={handleCreateMap}>
                <div className="grid gap-1.5">
                  <Label htmlFor="qual-map-index">{t("tournament.qualifier.stage", { stage: "" }).trim()}</Label>
                  <Input id="qual-map-index" min={1} required type="number" value={mapIndex} onChange={(event) => setMapIndex(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="qual-map-url">{t("tournament.admin.qualifier.beatmapUrl")}</Label>
                  <Input id="qual-map-url" required value={mapUrl} onChange={(event) => setMapUrl(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="qual-map-weight">{t("tournament.admin.qualifier.weight")}</Label>
                  <Input id="qual-map-weight" min={0} step="0.1" type="number" value={mapWeight} onChange={(event) => setMapWeight(event.target.value)} />
                </div>
                <Button className="self-end" disabled={createMapMutation.isPending || isQualifierLocked} type="submit">
                  <Plus className="size-4" weight="bold" />
                  {t("tournament.admin.bracket.addMap")}
                </Button>
              </form>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{t("tournament.qualifier.stage", { stage: "" }).trim()}</TableHead>
                    <TableHead>{t("tournament.referee.map")}</TableHead>
                    <TableHead>{t("tournament.admin.bracket.mapper")}</TableHead>
                    <TableHead className="text-right">{t("tournament.admin.qualifier.weight")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappool.map((map) => (
                    <TableRow key={map.id}>
                      <TableCell>{t("tournament.qualifier.stage", { stage: map.index })}</TableCell>
                      <TableCell>
                        <a className="font-medium hover:underline" href={`https://osu.ppy.sh/beatmaps/${map.map_id}`} rel="noreferrer" target="_blank">
                          {map.artist} - {map.title}
                        </a>
                        <p className="text-xs text-muted-foreground">{map.version ?? `Beatmap ${map.map_id}`}</p>
                      </TableCell>
                      <TableCell>{map.mapper}</TableCell>
                      <TableCell className="text-right">{map.weight ?? 1}</TableCell>
                    </TableRow>
                  ))}
                  {!mappoolQuery.isLoading && mappool.length === 0 ? <EmptyRow colSpan={4} label={t("tournament.qualifier.noMaps")} /> : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.admin.qualifier.rawScores")}</CardTitle>
              <CardAction>
                <Badge variant="outline">{scores.length}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tournament.referee.map")}</TableHead>
                    <TableHead>{t("tournament.referee.team")}</TableHead>
                    <TableHead>{t("tournament.common.player")}</TableHead>
                    <TableHead>{t("tournament.admin.qualifier.attempt")}</TableHead>
                    <TableHead className="text-right">{t("tournament.common.score")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.slice(0, 80).map((score) => (
                    <TableRow key={score.id}>
                      <TableCell>{score.map ? `Stage ${score.map.index}` : score.map_id}</TableCell>
                      <TableCell>{score.team ? getTeamName(score.team) : score.team_id}</TableCell>
                      <TableCell>{score.player?.user_name_snapshot ?? score.player?.user?.user_name ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {score.attempt_no ?? "-"}
                          {score.is_manual ? <Badge variant="secondary">{t("tournament.admin.qualifier.manual")}</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{score.score.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {!scoresQuery.isLoading && scores.length === 0 ? <EmptyRow colSpan={5} label={t("tournament.qualifier.noRankingTitle")} /> : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.admin.import.importTeams")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleFetchScores}>
                <div className="grid gap-1.5">
                  <Label>{t("tournament.referee.team")}</Label>
                  <Select value={selectedTeamId || allTeamsValue} onValueChange={setSelectedTeamId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("tournament.admin.qualifier.allDetectedTeams")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={allTeamsValue}>{t("tournament.admin.qualifier.allDetectedTeams")}</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>{getTeamName(team)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="qual-mp-id">{t("tournament.admin.qualifier.mpId")}</Label>
                  <Textarea
                    className="min-h-28 font-mono text-xs"
                    id="qual-mp-id"
                    placeholder={t("tournament.admin.qualifier.mpIdPlaceholder")}
                    required
                    value={mpId}
                    onChange={(event) => setMpId(event.target.value)}
                  />
                </div>
                <Button disabled={fetchScoresMutation.isPending || isQualifierLocked || parseMpIds(mpId).length === 0} type="submit">
                  <DownloadSimple className="size-4" weight="bold" />
                  {t("tournament.admin.bracket.importMpScores")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.admin.qualifier.manualCorrection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleUpdateScore}>
                <div className="grid gap-1.5">
                  <Label>{t("tournament.common.score")}</Label>
                  <Select value={selectedScoreId} onValueChange={(value) => {
                    const score = scores.find((item) => String(item.id) === value)
                    setSelectedScoreId(value)
                    setManualScore(score ? String(score.score) : "")
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("tournament.admin.qualifier.selectScore")} />
                    </SelectTrigger>
                    <SelectContent>
                      {scores.map((score) => (
                        <SelectItem key={score.id} value={String(score.id)}>{getScoreLabel(score)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="qual-manual-score">{t("tournament.common.score")}</Label>
                  <Input id="qual-manual-score" min={0} required type="number" value={manualScore} onChange={(event) => setManualScore(event.target.value)} />
                </div>
                <Button disabled={updateScoreMutation.isPending || isQualifierLocked || !selectedScoreId || !manualScore} type="submit">
                  {t("tournament.admin.qualifier.saveCorrection")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader className="border-b">
              <CardTitle>{t("tournament.admin.qualifier.importLogs")}</CardTitle>
              <CardAction>
                <Badge variant="outline">{importsQuery.data?.total ?? 0}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {imports.map((item) => (
                <article className="rounded-lg border p-3" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.team ? getTeamName(item.team) : `Team ${item.team_id}`}</p>
                      <p className="text-xs text-muted-foreground">MP {item.mp_id} / {formatDate(item.created_time)}</p>
                    </div>
                    <Badge variant={importStatusVariant[item.status] ?? "outline"}>{item.status}</Badge>
                  </div>
                  {item.message ? <p className="mt-2 text-xs text-muted-foreground">{item.message}</p> : null}
                  <p className="mt-2 text-xs text-muted-foreground">{t("tournament.admin.qualifier.by", { name: item.importedBy?.user_name ?? item.imported_by ?? "-" })}</p>
                </article>
              ))}
              {!importsQuery.isLoading && imports.length === 0 ? <p className="text-sm text-muted-foreground">{t("tournament.admin.qualifier.noImportLogs")}</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminPage>
  )
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-semibold">{value}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell className="h-24 text-center text-muted-foreground" colSpan={colSpan}>{label}</TableCell>
    </TableRow>
  )
}

function getTeamName(team: TournamentTeam) {
  return team.display_name || team.name || `Team ${team.id}`
}

function getScoreLabel(score: TournamentQualScore) {
  const map = score.map ? `Stage ${score.map.index}` : `Map ${score.map_id}`
  const team = score.team ? getTeamName(score.team) : `Team ${score.team_id}`
  const player = score.player?.user_name_snapshot ?? score.player?.user?.user_name ?? "-"
  return `${map} / ${team} / ${player} / ${score.score}`
}

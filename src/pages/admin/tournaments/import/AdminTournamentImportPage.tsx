import { CheckCircle, ClipboardText, Eye, UploadSimple } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  useImportTournamentGoogleFormTeamsMutation,
  useImportTournamentHistoricalTeamsMutation,
  useTournamentDetailQuery,
  type TournamentHistoricalImportRequest,
  type TournamentHistoricalImportResult,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { AppAlert, FormPageSkeleton, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

const samplePayload: TournamentHistoricalImportRequest = {
  batch_id: "JHC2024-history-import-001",
  dry_run: true,
  teams: [
    {
      display_name: "Example Team",
      name: "Example Team",
      players: [
        {
          is_captain: true,
          osu_uid: 123456,
          review_status: "review_passed",
          user_name: "captain_name",
        },
        {
          avatar: "https://a.ppy.sh/234567",
          osu_uid: 234567,
          review_status: "review_passed",
          user_name: "member_name",
        },
      ],
      qual_rank: 1,
      qual_score: 1234567,
      status: 1,
    },
  ],
}

const sampleText = JSON.stringify(samplePayload, null, 2)

export function AdminTournamentImportPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const importMutation = useImportTournamentHistoricalTeamsMutation(tid ?? "")
  const googleFormImportMutation = useImportTournamentGoogleFormTeamsMutation(tid ?? "")
  const [payloadText, setPayloadText] = useState(sampleText)
  const [sheetUrl, setSheetUrl] = useState("")
  const [csvText, setCsvText] = useState("")
  const [batchId, setBatchId] = useState("JHC2025-google-form")
  const [lastResult, setLastResult] = useState<TournamentHistoricalImportResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  if (tournamentQuery.isError) {
    return <PageState title={t("tournament.admin.common.tournamentLoadFailed")} description={getErrorMessage(tournamentQuery.error)} />
  }

  const parsePayload = (dryRun: boolean) => {
    try {
      const parsed = JSON.parse(payloadText) as TournamentHistoricalImportRequest
      setParseError(null)
      return { ...parsed, dry_run: dryRun }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("tournament.admin.import.invalidJson")
      setParseError(message)
      return null
    }
  }

  const submitImport = (dryRun: boolean) => {
    const payload = parsePayload(dryRun)
    if (!payload) return

    importMutation.mutate(payload, {
      onSuccess: (result) => {
        setLastResult(result)
        toast.success(dryRun ? t("tournament.admin.import.dryRunPassed") : t("tournament.admin.import.imported"))
      },
    })
  }

  const submitGoogleFormImport = (dryRun: boolean) => {
    googleFormImportMutation.mutate(
      {
        batch_id: batchId.trim() || undefined,
        csv_text: csvText.trim() || undefined,
        dry_run: dryRun,
        source_url: sheetUrl.trim() || undefined,
      },
      {
        onSuccess: (result) => {
          setLastResult(result)
          toast.success(dryRun ? t("tournament.admin.import.dryRunPassed") : t("tournament.admin.import.imported"))
        },
      },
    )
  }

  return (
    <AdminPage
      actions={(
        <>
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={`${getTournamentPublicPath(tournamentQuery.data)}/teams`}>
                <Eye className="size-4" />
                {t("tournament.admin.import.viewTeams")}
              </Link>
            </Button>
          ) : null}
        </>
      )}
      breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.admin.common.import")} tournament={tournamentQuery.data} tournamentId={tid} />}
    >
      {tournamentQuery.isLoading ? <FormPageSkeleton /> : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{t("tournament.admin.import.historicalImport")}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("tournament.admin.import.googleFormDescription")}
                  </p>
                </div>
                <Badge variant="outline">{tournamentQuery.data?.name ?? t("tournament.common.tournament")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AppAlert tone="warning" title={t("tournament.admin.import.rulesTitle")}>{t("tournament.admin.import.rulesDescription")}</AppAlert>

              {googleFormImportMutation.isError ? <MutationErrorAlert error={googleFormImportMutation.error} title={t("tournament.admin.import.importFailed")} /> : null}

              <div className="space-y-2">
                <Label htmlFor="google-form-batch">{t("tournament.admin.import.batch")}</Label>
                <Input id="google-form-batch" value={batchId} onChange={(event) => setBatchId(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-form-url">{t("tournament.admin.import.googleSheetUrl")}</Label>
                <Input
                  id="google-form-url"
                  placeholder={t("tournament.admin.import.googleSheetUrlPlaceholder")}
                  value={sheetUrl}
                  onChange={(event) => setSheetUrl(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google-form-csv">{t("tournament.admin.import.csvFallback")}</Label>
                <Textarea
                  className="min-h-[220px] font-mono text-xs leading-relaxed"
                  id="google-form-csv"
                  onChange={(event) => setCsvText(event.target.value)}
                  placeholder={t("tournament.admin.import.csvFallbackPlaceholder")}
                  spellCheck={false}
                  value={csvText}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={googleFormImportMutation.isPending}
                  onClick={() => submitGoogleFormImport(true)}
                  type="button"
                  variant="outline"
                >
                  <ClipboardText className="size-4" />
                  {t("tournament.admin.import.dryRun")}
                </Button>
                <Button
                  disabled={googleFormImportMutation.isPending}
                  onClick={() => submitGoogleFormImport(false)}
                  type="button"
                >
                  <UploadSimple className="size-4" weight="bold" />
                  {t("tournament.admin.import.importTeams")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("tournament.admin.import.advancedJson")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parseError ? <AppAlert tone="destructive" title={t("tournament.admin.import.jsonParseFailed")}>{parseError}</AppAlert> : null}
              {importMutation.isError ? <MutationErrorAlert error={importMutation.error} title={t("tournament.admin.import.importFailed")} /> : null}

              <div className="space-y-2">
                <Label htmlFor="historical-import-json">{t("tournament.admin.import.importJson")}</Label>
                <Textarea
                  className="min-h-[320px] font-mono text-xs leading-relaxed"
                  id="historical-import-json"
                  onChange={(event) => setPayloadText(event.target.value)}
                  spellCheck={false}
                  value={payloadText}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={importMutation.isPending}
                  onClick={() => submitImport(true)}
                  type="button"
                  variant="outline"
                >
                  <ClipboardText className="size-4" />
                  {t("tournament.admin.import.dryRun")}
                </Button>
                <Button
                  disabled={importMutation.isPending}
                  onClick={() => submitImport(false)}
                  type="button"
                >
                  <UploadSimple className="size-4" weight="bold" />
                  {t("tournament.admin.import.importTeams")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("tournament.admin.import.payloadShape")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t("tournament.admin.import.payloadBatch")}</p>
              <p>{t("tournament.admin.import.payloadTeam")}</p>
              <p>{t("tournament.admin.import.payloadIdentity")}</p>
              <Separator />
              <Button onClick={() => setPayloadText(sampleText)} size="sm" type="button" variant="outline">
                {t("tournament.admin.import.resetSample")}
              </Button>
            </CardContent>
          </Card>

          {lastResult ? <ImportResult result={lastResult} /> : null}
        </div>
        </div>
      )}
    </AdminPage>
  )
}

function ImportResult({ result }: { result: TournamentHistoricalImportResult }) {
  const { t } = useTranslation()
  const createdUsers = result.created_users ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("tournament.admin.import.lastResult")}</CardTitle>
          <Badge variant={result.dry_run ? "secondary" : "default"}>{result.dry_run ? t("tournament.admin.import.dryRun") : t("tournament.admin.import.importedBadge")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <ResultMetric label={t("tournament.admin.import.batch")} value={result.batch_id} />
          <ResultMetric label={t("tournament.admin.import.teams")} value={String(result.teams.length)} />
          <ResultMetric label={t("tournament.admin.import.placeholderUsers")} value={String(createdUsers.length)} />
        </div>

        <div className="divide-y text-sm">
          {result.teams.map((team) => (
            <div className="py-3" key={`${team.display_name}-${team.team_id ?? "dry"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{team.display_name}</p>
                <Badge variant="outline">{t("tournament.admin.import.playerCount", { count: team.player_count })}</Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {team.players.map((player) => (
                  <div className="flex items-center gap-2" key={`${team.display_name}-${player.user_id}`}>
                    {player.is_captain ? <CheckCircle className="size-3.5 text-emerald-600" weight="bold" /> : <span className="size-3.5" />}
                    <span>{player.user_name_snapshot}</span>
                    <span>#{player.user_id}</span>
                    {player.created_user ? <Badge variant="secondary">{t("tournament.admin.import.newUser")}</Badge> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  )
}

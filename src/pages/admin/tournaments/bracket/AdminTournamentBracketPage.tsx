import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowSquareOut, BracketsCurly, Check, ImagesSquare, PencilSimple, X } from "@phosphor-icons/react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  useGenerateTournamentBracketMutation,
  useTournamentBracketQuery,
  useTournamentDetailQuery,
  useUpdateTournamentMatchMutation,
  type TournamentMatch,
  type TournamentTeam,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageSkeleton, PageState } from "@/shared/components"
import { DateTimePicker } from "@/shared/components/DateTimePicker"
import { teamName } from "./utils"
import { getMainStageLabel, getMatchStage, getStageSortIndex, type MainStageKey } from "@/pages/tournaments/_shared/tournamentRoundStages"
import { formatTournamentScheduleTimeUtc, fromUtcDateTimeInputValue, toUtcDateTimeInputValue } from "@/pages/tournaments/_shared/tournamentScheduleTime"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

const EMPTY_MATCHES: TournamentMatch[] = []

export function AdminTournamentBracketPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const tournamentId = tid ?? ""
  const [editingScheduleMatchId, setEditingScheduleMatchId] = useState<number | null>(null)
  const [scheduleDraftUtc, setScheduleDraftUtc] = useState("")

  const tournamentQuery = useTournamentDetailQuery(tid)
  const bracketQuery = useTournamentBracketQuery(tid)
  const matches = bracketQuery.data ?? EMPTY_MATCHES
  const matchNumbers = useMemo(() => createTournamentMatchNumbers(matches), [matches])
  const scheduleGroups = useMemo(() => groupMatchesForAdminSchedule(matches), [matches])
  const hashGroupKey = location.hash.slice(1).trim().toLowerCase()
  const selectedGroup = scheduleGroups.find((group) => group.key === hashGroupKey)
    ?? scheduleGroups.find((group) => group.matches.some((match) => match.status !== 2))
    ?? scheduleGroups.at(-1)
  const generateBracketMutation = useGenerateTournamentBracketMutation(tournamentId)
  const updateMatchMutation = useUpdateTournamentMatchMutation(tournamentId)
  const publicTournamentPath = tournamentQuery.data ? getTournamentPublicPath(tournamentQuery.data) : `/t/${tournamentId}`

  useEffect(() => {
    if (!selectedGroup || hashGroupKey === selectedGroup.key) return
    navigate(`${location.pathname}${location.search}#${selectedGroup.key}`, { replace: true })
  }, [hashGroupKey, location.pathname, location.search, navigate, selectedGroup])

  function startEditingSchedule(match: TournamentMatch) {
    setEditingScheduleMatchId(match.id)
    setScheduleDraftUtc(toUtcDateTimeInputValue(match.scheduled_time))
  }

  function stopEditingSchedule() {
    setEditingScheduleMatchId(null)
    setScheduleDraftUtc("")
  }

  function saveScheduleTime(match: TournamentMatch) {
    updateMatchMutation.mutate(
      {
        matchId: match.id,
        request: { scheduled_time: fromUtcDateTimeInputValue(scheduleDraftUtc) },
      },
      {
        onSuccess: () => {
          stopEditingSchedule()
          toast.success("赛程时间已保存")
        },
      },
    )
  }

  if (tournamentQuery.isError || bracketQuery.isError) {
    return (
      <PageState
        title={t("tournament.admin.bracket.loadFailed")}
        description={getErrorMessage(tournamentQuery.error ?? bracketQuery.error)}
      />
    )
  }

  if (tournamentQuery.isLoading || bracketQuery.isLoading) {
    return (
      <AdminPage breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.common.schedule")} tournament={tournamentQuery.data} tournamentId={tid} />}>
        <PageSkeleton />
      </AdminPage>
    )
  }

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild size="sm" variant="outline">
            <Link to={`/admin/tournaments/${tournamentId}/mappool`}>
              <ImagesSquare className="size-4" />
              {t("tournament.qualifier.mappool")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`${publicTournamentPath}/bracket`}>{t("tournament.admin.bracket.publicBracket")}</Link>
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
      breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.common.schedule")} tournament={tournamentQuery.data} tournamentId={tid} />}
      headerCenter={scheduleGroups.length > 0 ? (
        <Tabs
          className="min-w-0 max-w-full"
          value={selectedGroup?.key ?? ""}
          onValueChange={(value) => navigate(`${location.pathname}${location.search}#${value}`)}
        >
          <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="max-w-none flex-nowrap justify-start gap-2 overflow-visible rounded-none bg-transparent p-0">
              {scheduleGroups.map((group) => (
                <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" key={group.key} value={group.key}>
                  {group.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      ) : <span />}
    >
      {generateBracketMutation.isError || updateMatchMutation.isError ? <MutationErrorAlert error={generateBracketMutation.error ?? updateMatchMutation.error} title={t("tournament.admin.bracket.operationFailed")} /> : null}

      {!tournamentQuery.data?.qual_locked_at ? (
        <AppAlert title={t("tournament.admin.bracket.rankingNotLocked")}>{t("tournament.admin.bracket.lockedRequiredDescription")}</AppAlert>
      ) : null}

      <section>
        <div className="overflow-x-auto">
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 w-20 px-2 py-1 text-xs">{t("tournament.common.match", { id: "" }).trim()}</TableHead>
                  <TableHead className="h-8 w-14 px-2 py-1 text-xs">组别</TableHead>
                  <TableHead className="h-8 px-2 py-1 text-xs">Team Red</TableHead>
                  <TableHead className="h-8 px-2 py-1 text-xs">Team Blue</TableHead>
                  <TableHead className="h-8 w-20 px-2 py-1 text-xs">赛制</TableHead>
                  <TableHead className="h-8 w-16 px-2 py-1 text-xs">{t("tournament.common.score")}</TableHead>
                  <TableHead className="h-8 w-64 px-2 py-1 text-xs">{t("tournament.admin.bracket.schedule")} UTC</TableHead>
                  <TableHead className="h-8 px-2 py-1 text-xs">{t("tournament.admin.list.status")}</TableHead>
                  <TableHead className="h-8 px-2 py-1 text-right text-xs">{t("tournament.admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedGroup ? (
                  <TableRow>
                    <TableCell className="py-8 text-center text-muted-foreground" colSpan={9}>{t("tournament.admin.bracket.noMatches")}</TableCell>
                  </TableRow>
                ) : selectedGroup.matches.map((match) => (
                  <TableRow className="h-9" key={match.id}>
                    <TableCell className="px-2 py-1 text-xs font-medium">#{matchNumbers.get(match.id) ?? match.id}</TableCell>
                    <TableCell className="px-2 py-1">
                      <Badge className="px-1.5 py-0 text-[10px]" variant="outline">{bracketShortLabel(match.bracket_group)}</Badge>
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      <MatchTeamInline label={getSourceLabel(match, 1, matchNumbers)} team={match.team1} />
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      <MatchTeamInline label={getSourceLabel(match, 2, matchNumbers)} team={match.team2} />
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs">
                      <FormatBadge stage={selectedGroup.stage} />
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs">{match.team1_score ?? 0}:{match.team2_score ?? 0}</TableCell>
                    <TableCell className="px-2 py-1 text-xs">
                      <ScheduleTimeEditor
                        disabled={updateMatchMutation.isPending}
                        isEditing={editingScheduleMatchId === match.id}
                        value={scheduleDraftUtc}
                        scheduledTime={match.scheduled_time}
                        onCancel={stopEditingSchedule}
                        onChange={setScheduleDraftUtc}
                        onEdit={() => startEditingSchedule(match)}
                        onSave={() => saveScheduleTime(match)}
                      />
                    </TableCell>
                    <TableCell className="px-2 py-1"><Badge className="px-1.5 py-0 text-[10px]" variant={match.status === 2 ? "default" : "outline"}>{match.status === 2 ? t("tournament.common.done") : match.status === 1 ? t("tournament.common.inProgress") : t("tournament.common.notStarted")}</Badge></TableCell>
                    <TableCell className="px-2 py-1">
                      <div className="flex justify-end gap-1.5">
                        <Button asChild size="xs" type="button" variant="outline">
                          <Link to={`${publicTournamentPath}/referee/${match.id}`}>{t("tournament.admin.bracket.referee")}</Link>
                        </Button>
                        <Button asChild size="icon-xs" type="button" variant="ghost">
                          <Link to={`${publicTournamentPath}/match/${match.id}`} aria-label={t("tournament.common.match", { id: match.id })}>
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
      </section>
    </AdminPage>
  )
}

function MatchTeamInline({ label, team }: { label: string; team?: TournamentTeam | null }) {
  if (!team) {
    return <span className="block min-w-40 truncate text-xs text-muted-foreground">{label}</span>
  }

  return (
    <div className="flex min-w-40 items-center gap-1.5">
      <Badge className="shrink-0 px-1.5 py-0 text-[10px]" variant="outline">{seedLabel(team)}</Badge>
      <span className="min-w-0 truncate font-medium">{teamName(team)}</span>
    </div>
  )
}

function FormatBadge({ stage }: { stage: MainStageKey | null }) {
  const firstTo = getFixedFirstTo(stage)
  const bo = typeof firstTo === "number" ? firstTo * 2 - 1 : "-"
  return (
    <span className="font-medium">BO{bo}</span>
  )
}

function ScheduleTimeEditor({
  disabled,
  isEditing,
  onCancel,
  onChange,
  onEdit,
  onSave,
  scheduledTime,
  value,
}: {
  disabled: boolean
  isEditing: boolean
  onCancel: () => void
  onChange: (value: string) => void
  onEdit: () => void
  onSave: () => void
  scheduledTime?: string | null
  value: string
}) {
  if (isEditing) {
    return (
      <div className="flex min-w-60 items-center gap-1.5">
        <DateTimePicker
          className="h-7 w-48 text-xs"
          disabled={disabled}
          minuteStep={10}
          timeZone="UTC"
          value={value}
          onChange={onChange}
        />
        <Button aria-label="保存赛程时间" disabled={disabled} size="icon-xs" type="button" onClick={onSave}>
          <Check className="size-3.5" weight="bold" />
        </Button>
        <Button aria-label="取消编辑赛程时间" disabled={disabled} size="icon-xs" type="button" variant="ghost" onClick={onCancel}>
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-w-60 items-center justify-between gap-2">
      <span className="truncate tabular-nums">{formatTournamentScheduleTimeUtc(scheduledTime)}</span>
      <Button aria-label="编辑赛程时间" disabled={disabled} size="icon-xs" type="button" variant="ghost" onClick={onEdit}>
        <PencilSimple className="size-3.5" />
      </Button>
    </div>
  )
}

type AdminScheduleGroup = {
  key: string
  label: string
  matches: TournamentMatch[]
  stage: MainStageKey | null
}

function groupMatchesForAdminSchedule(matches: TournamentMatch[]): AdminScheduleGroup[] {
  const groups = new Map<string, TournamentMatch[]>()
  for (const match of matches) {
    const stage = getMatchStage(match)
    const key = stage ?? "other"
    groups.set(key, [...(groups.get(key) ?? []), match])
  }

  return Array.from(groups.entries()).map(([key, items]) => {
    const stage = key === "other" ? null : key as MainStageKey
    return {
      key,
      label: stage ? getMainStageLabel(stage) : "Other",
      matches: items.sort(compareMatchesForAdmin),
      stage,
    }
  }).sort((a, b) => getStageSortIndex(a.stage) - getStageSortIndex(b.stage))
}

function compareMatchesForAdmin(a: TournamentMatch, b: TournamentMatch) {
  return (getGeneratedBracketMatchNumber(a) ?? Number.MAX_SAFE_INTEGER) - (getGeneratedBracketMatchNumber(b) ?? Number.MAX_SAFE_INTEGER)
    || (a.slot_no ?? a.id) - (b.slot_no ?? b.id)
    || a.id - b.id
}

function getFixedFirstTo(stage: MainStageKey | null) {
  if (stage === "ro32" || stage === "ro16") return 5
  if (stage === "qf" || stage === "sf") return 6
  if (stage === "f" || stage === "gf") return 7
  return "-"
}

function getSourceLabel(match: TournamentMatch, side: 1 | 2, matchNumbers: Map<number, number>) {
  const sourceMatchId = side === 1 ? match.source_match_1_id : match.source_match_2_id
  const sourceResult = side === 1 ? match.source_match_1_result : match.source_match_2_result
  if (!sourceMatchId || !sourceResult) return "TBD"

  const resultLabel = sourceResult === "loser" ? "Loser" : sourceResult === "winner" ? "Winner" : sourceResult
  return `${resultLabel} of match ${matchNumbers.get(sourceMatchId) ?? sourceMatchId}`
}

function bracketShortLabel(group?: string | null) {
  if (group === "winner") return "WB"
  if (group === "loser") return "LB"
  if (group === "grand_final") return "GF"
  if (group === "reset_final") return "GFR"
  return "-"
}

function seedLabel(team?: TournamentTeam | null) {
  return team?.qual_rank ? `#${team.qual_rank}` : "#-"
}

function createTournamentMatchNumbers(matches: TournamentMatch[]) {
  const numbers = new Map<number, number>()
  const reservedNumbers = new Set<number>()
  const sortedMatches = [...matches].sort(compareMatchesForAdmin)

  for (const match of sortedMatches) {
    const number = getGeneratedBracketMatchNumber(match)
    if (!number || reservedNumbers.has(number)) continue
    numbers.set(match.id, number)
    reservedNumbers.add(number)
  }

  let fallbackNumber = 1
  for (const match of sortedMatches) {
    if (numbers.has(match.id)) continue
    while (reservedNumbers.has(fallbackNumber)) fallbackNumber += 1
    numbers.set(match.id, fallbackNumber)
    reservedNumbers.add(fallbackNumber)
  }
  return numbers
}

function getGeneratedBracketMatchNumber(match: TournamentMatch) {
  const slot = match.slot_no
  if (!slot || slot < 1) return null

  const roundNo = match.round_no ?? match.round?.order ?? null
  if (match.bracket_group === "winner") {
    const offsets: Record<number, number> = {
      1: 0,
      2: 24,
      3: 44,
      4: 54,
      5: 59,
    }
    const offset = roundNo ? offsets[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }

  if (match.bracket_group === "loser") {
    const offsets: Record<number, number> = {
      1: 16,
      2: 32,
      3: 40,
      4: 48,
      5: 52,
      6: 56,
      7: 58,
      8: 60,
    }
    const offset = roundNo ? offsets[roundNo] : undefined
    return offset === undefined ? null : offset + slot
  }

  if (match.bracket_group === "grand_final") return 62
  if (match.bracket_group === "reset_final") return 63
  return null
}

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ArrowClockwise, Calculator, Plus, Trash } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import {
  useCreateTournamentRoundMapMutation,
  useCalculateTournamentMappoolStatsMutation,
  useDeleteTournamentRoundMapMutation,
  useTournamentDetailQuery,
  useTournamentMappoolStatsManageQuery,
  useTournamentRoundsQuery,
  type TournamentMappoolMap,
  type TournamentMappoolStatsManageStage,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageSkeleton, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { Field } from "@/pages/admin/tournaments/bracket/components"
import { defaultMapForm, MAIN_STAGE_MAP_TYPES, type MapFormState } from "@/pages/admin/tournaments/bracket/model"
import { groupRoundsByMainStage } from "@/pages/tournaments/_shared/tournamentRoundStages"
import { buildMappoolLabelMap, getMappoolLabel, sortMappoolMaps } from "@/pages/tournaments/_shared/tournamentMappool"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

export function AdminTournamentMappoolPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentId = tid ?? ""
  const [selectedStageKey, setSelectedStageKey] = useState("")
  const [mapForm, setMapForm] = useState<MapFormState>(defaultMapForm)

  const tournamentQuery = useTournamentDetailQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const statsManageQuery = useTournamentMappoolStatsManageQuery(tid)
  const createMapMutation = useCreateTournamentRoundMapMutation(tournamentId)
  const deleteMapMutation = useDeleteTournamentRoundMapMutation(tournamentId)
  const calculateStatsMutation = useCalculateTournamentMappoolStatsMutation(tournamentId)

  const rounds = useMemo(() => [...(roundsQuery.data ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [roundsQuery.data])
  const stages = useMemo(() => groupRoundsByMainStage(rounds), [rounds])
  const selectedStage = stages.find((stage) => stage.key === selectedStageKey) ?? stages[0]
  const selectedRound = selectedStage?.rounds[0]
  const selectedMaps = sortMappoolMaps(selectedStage?.maps ?? [])
  const selectedStatsStatus = statsManageQuery.data?.stages.find((stage) => stage.key === selectedStage?.key)
  const labelById = buildMappoolLabelMap(selectedMaps)
  const mutationError = createMapMutation.error ?? deleteMapMutation.error ?? calculateStatsMutation.error
  const publicTournamentPath = tournamentQuery.data ? getTournamentPublicPath(tournamentQuery.data) : `/t/${tournamentId}`

  if (tournamentQuery.isError || roundsQuery.isError || statsManageQuery.isError) {
    return <PageState title={t("tournament.admin.bracket.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? roundsQuery.error ?? statsManageQuery.error)} />
  }

  if (tournamentQuery.isLoading || roundsQuery.isLoading || statsManageQuery.isLoading) {
    return (
      <AdminPage breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.qualifier.mappool")} tournament={tournamentQuery.data} tournamentId={tid} />}>
        <PageSkeleton />
      </AdminPage>
    )
  }

  function handleCreateMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRound) return

    createMapMutation.mutate(
      {
        request: {
          beatmap_url: mapForm.beatmap_url.trim(),
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

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild size="sm" variant="outline">
            <Link to={`${publicTournamentPath}/mappool`}>{t("tournament.admin.common.view")}</Link>
          </Button>
        </>
      )}
      breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.qualifier.mappool")} tournament={tournamentQuery.data} tournamentId={tid} />}
    >
      {mutationError ? <MutationErrorAlert error={mutationError} title={t("tournament.admin.bracket.operationFailed")} /> : null}

      <div className="space-y-3">
        {!selectedStage || !selectedRound ? (
          <AppAlert title={t("tournament.admin.bracket.createRoundFirstTitle")}>{t("tournament.admin.bracket.createRoundFirstDescription")}</AppAlert>
        ) : (
          <>
            <Tabs value={selectedStage.key} onValueChange={setSelectedStageKey}>
              <div className="-mx-1 overflow-x-auto overflow-y-visible px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="max-w-none flex-nowrap justify-start gap-2 overflow-visible rounded-none bg-transparent p-0">
                  {stages.map((stage) => (
                    <TabsTrigger className="shrink-0 flex-none border bg-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" key={stage.key} value={stage.key}>
                      {stage.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            <MappoolStatsCalculation
              isPending={calculateStatsMutation.isPending && calculateStatsMutation.variables === selectedStage.key}
              onCalculate={() => calculateStatsMutation.mutate(selectedStage.key, {
                onSuccess: () => toast.success(t(selectedStatsStatus?.is_calculated ? "tournament.admin.mappool.statsRecalculated" : "tournament.admin.mappool.statsCalculated")),
              })}
              status={selectedStatsStatus}
            />

            <form className="grid items-end gap-3 lg:grid-cols-[9rem_minmax(18rem,1fr)_auto]" onSubmit={handleCreateMap}>
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
              <Field label={t("tournament.admin.bracket.beatmapUrl")}>
                <Input required value={mapForm.beatmap_url} onChange={(event) => setMapForm((state) => ({ ...state, beatmap_url: event.target.value }))} />
              </Field>
              <Button disabled={createMapMutation.isPending} type="submit">
                <Plus className="size-4" weight="bold" />
                {t("tournament.admin.bracket.addMap")}
              </Button>
            </form>

            <MappoolTable
              isDeleting={deleteMapMutation.isPending}
              labelById={labelById}
              maps={selectedMaps}
              onDelete={(map) => deleteMapMutation.mutate(
                { mapId: map.id, roundId: selectedRound.id },
                { onSuccess: () => toast.success(t("tournament.admin.bracket.roundMapDeleted")) },
              )}
            />
          </>
        )}
      </div>
    </AdminPage>
  )
}

function MappoolStatsCalculation({
  isPending,
  onCalculate,
  status,
}: {
  isPending: boolean
  onCalculate: () => void
  status: TournamentMappoolStatsManageStage | undefined
}) {
  const { t } = useTranslation()

  if (!status) return null

  const description = status.map_count === 0
    ? t("tournament.admin.mappool.statsNoMapsDescription")
    : status.is_complete
    ? status.is_calculated
      ? t("tournament.admin.mappool.statsPublishedDescription", {
          count: status.valid_match_count ?? 0,
          time: status.calculated_at ? formatDate(status.calculated_at) : "-",
        })
      : t("tournament.admin.mappool.statsReadyDescription", { count: status.match_count })
    : t("tournament.admin.mappool.statsProgressDescription", {
        completed: status.completed_match_count,
        total: status.match_count,
      })

  return (
    <AppAlert
      title={status.is_calculated ? t("tournament.admin.mappool.statsPublishedTitle") : t("tournament.admin.mappool.statsTitle")}
      tone={status.can_calculate ? "success" : "default"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{description}</span>
        <Button disabled={!status.can_calculate || isPending} size="sm" type="button" variant={status.is_calculated ? "outline" : "default"} onClick={onCalculate}>
          {status.is_calculated ? <ArrowClockwise className="size-4" weight="bold" /> : <Calculator className="size-4" weight="bold" />}
          {status.is_calculated ? t("tournament.admin.mappool.recalculateStats") : t("tournament.admin.mappool.calculateStats")}
        </Button>
      </div>
    </AppAlert>
  )
}

function MappoolTable({
  isDeleting,
  labelById,
  maps,
  onDelete,
}: {
  isDeleting: boolean
  labelById: Map<number, string>
  maps: TournamentMappoolMap[]
  onDelete: (map: TournamentMappoolMap) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="h-8">
            <TableHead className="h-8 w-24 px-2 py-1 text-xs">{t("tournament.admin.bracket.mapType")}</TableHead>
            <TableHead className="h-8 px-2 py-1 text-xs">谱面</TableHead>
            <TableHead className="h-8 w-32 px-2 py-1 text-xs">Beatmap ID</TableHead>
            <TableHead className="h-8 w-40 px-2 py-1 text-xs">Mapper</TableHead>
            <TableHead className="h-8 w-36 px-2 py-1 text-xs">添加时间</TableHead>
            <TableHead className="h-8 px-2 py-1 text-right text-xs">{t("tournament.admin.common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maps.length === 0 ? (
            <TableRow>
              <TableCell className="px-2 py-6 text-center text-sm text-muted-foreground" colSpan={6}>{t("tournament.admin.bracket.noMapsInRound")}</TableCell>
            </TableRow>
          ) : maps.map((map) => (
            <TableRow className="h-9" key={map.id}>
              <TableCell className="px-2 py-1"><Badge className="px-1.5 py-0 text-[10px]" variant="outline">{getMappoolLabel(map, labelById)}</Badge></TableCell>
              <TableCell className="px-2 py-1">
                <a className="font-medium hover:underline" href={`https://osu.ppy.sh/beatmaps/${map.map_id}`} rel="noreferrer" target="_blank">
                  {map.artist} - {map.title}
                </a>
              </TableCell>
              <TableCell className="px-2 py-1">#{map.map_id}</TableCell>
              <TableCell className="px-2 py-1">{map.mapper || "-"}</TableCell>
              <TableCell className="px-2 py-1">{map.created_time ? formatDate(map.created_time) : "-"}</TableCell>
              <TableCell className="px-2 py-1">
                <div className="flex justify-end">
                  <Button disabled={isDeleting} size="icon-xs" type="button" variant="ghost" onClick={() => onDelete(map)}>
                    <Trash className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

import { DownloadSimple, FloppyDisk, Plus, Trash } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import {
  useCreateEventStagesMutation,
  useDeleteEventStageMutation,
  useEventStagesQuery,
  useImportEventStagesMutation,
  useUpdateEventStageMutation,
  type EventStageMutationRequest,
  type EventStageSummary,
} from "@/entities/event"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"

const MAX_BG_SIZE = 1024 * 1024
const STAGE_DRAFT_STORAGE_PREFIX = "jackhouse:admin:event-stage-draft:"

type EditableStage = {
  artist: string
  file: File | null
  id: string
  map_id: string
  mapper: string
  title: string
}

type ExistingStageDraft = {
  artist: string
  map_id: string
  mapper: string
  title: string
}

export function AdminEventStagesPage() {
  const { t } = useTranslation()
  const { eventId } = useParams()
  const normalizedEventId = eventId ?? ""
  const stagesQuery = useEventStagesQuery(normalizedEventId)
  const createMutation = useCreateEventStagesMutation(normalizedEventId)
  const importMutation = useImportEventStagesMutation()
  const updateMutation = useUpdateEventStageMutation(normalizedEventId)
  const deleteMutation = useDeleteEventStageMutation(normalizedEventId)
  const [newStages, setNewStages] = useState<EditableStage[]>(() => loadStageDraft(normalizedEventId))
  const [beatmapsetId, setBeatmapsetId] = useState("")
  const [editingDrafts, setEditingDrafts] = useState<Record<number, ExistingStageDraft>>({})
  const [deletingStage, setDeletingStage] = useState<EventStageSummary | null>(null)

  const eventName = stagesQuery.data?.event?.name ?? `Event ${normalizedEventId}`
  const isCreating = createMutation.isPending
  const hasNewStages = newStages.length > 0

  const canSubmitNewStages = useMemo(() => {
    return newStages.length > 0 && newStages.every((stage) => isValidStageDraft(stage) && stage.file)
  }, [newStages])

  useEffect(() => {
    saveStageDraft(normalizedEventId, newStages)
  }, [newStages, normalizedEventId])

  if (!eventId) {
    return <PageState title={t("admin.eventStages.missingIdTitle")} description={t("admin.eventStages.missingIdDescription")} />
  }

  if (stagesQuery.isError) {
    return <PageState title={t("admin.eventStages.loadFailedTitle")} description={getErrorMessage(stagesQuery.error)} />
  }

  const addStage = () => {
    setNewStages((current) => [
      ...current,
      {
        artist: "",
        file: null,
        id: crypto.randomUUID(),
        map_id: "",
        mapper: "",
        title: "",
      },
    ])
  }

  const importBeatmapset = () => {
    const numericBeatmapsetId = Number(beatmapsetId)
    if (!Number.isSafeInteger(numericBeatmapsetId) || numericBeatmapsetId <= 0) {
      toast.error(t("admin.eventStages.import.invalidId"))
      return
    }

    importMutation.mutate(numericBeatmapsetId, {
      onSuccess: ({ data }) => {
        const existingIds = new Set([
          ...(stagesQuery.data?.data.map((stage) => Number(stage.map_id)) ?? []),
          ...newStages.map((stage) => Number(stage.map_id)),
        ])
        const importedIds = new Set<number>()
        const importedStages = data.filter((stage) => {
          const mapId = Number(stage.map_id)
          if (existingIds.has(mapId) || importedIds.has(mapId)) return false
          importedIds.add(mapId)
          return true
        }).map((stage): EditableStage => ({
          artist: "",
          file: null,
          id: crypto.randomUUID(),
          map_id: String(stage.map_id),
          mapper: "",
          title: stage.title,
        }))

        if (importedStages.length === 0) {
          toast.info(t("admin.eventStages.import.noNewStages"))
          return
        }

        setNewStages((current) => [...current, ...importedStages])
        toast.success(t("admin.eventStages.import.success", { count: importedStages.length }))
      },
    })
  }

  const submitNewStages = () => {
    const invalidStage = newStages.find((stage) => !isValidStageDraft(stage) || !stage.file)

    if (invalidStage) {
      toast.error(t("admin.eventStages.invalidNewStage"))
      return
    }

    createMutation.mutate({
      eventId,
      files: newStages.map((stage) => stage.file as File),
      stages: newStages.map(toStageMutationRequest),
    }, {
      onSuccess: () => {
        toast.success(t("admin.eventStages.created"))
        setNewStages([])
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b pb-3 lg:flex-row lg:items-center lg:justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/events">{t("admin.eventStages.eventsBreadcrumb")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{eventName}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("admin.eventStages.stagesBreadcrumb")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap gap-2">
          <div className="flex min-w-64 flex-1 gap-2 lg:min-w-80 lg:flex-initial">
            <Input
              aria-label={t("admin.eventStages.import.inputLabel")}
              className="min-w-0 lg:w-52"
              disabled={importMutation.isPending}
              inputMode="numeric"
              placeholder={t("admin.eventStages.import.placeholder")}
              value={beatmapsetId}
              onChange={(event) => setBeatmapsetId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") importBeatmapset()
              }}
            />
            <Button disabled={importMutation.isPending || !beatmapsetId.trim()} onClick={importBeatmapset} type="button" variant="outline">
              <DownloadSimple className="size-4" weight="bold" />
              {importMutation.isPending ? t("admin.eventStages.import.importing") : t("admin.eventStages.import.button")}
            </Button>
          </div>
          <Button onClick={addStage} type="button" variant="outline">
            <Plus className="size-4" weight="bold" />
            {t("admin.eventStages.addStage")}
          </Button>
          <Button disabled={!canSubmitNewStages || isCreating} onClick={submitNewStages} type="button">
            <FloppyDisk className="size-4" weight="bold" />
            {t("admin.eventStages.submitNew")}
          </Button>
        </div>
      </div>

      {createMutation.error ? <MutationErrorAlert error={createMutation.error} /> : null}
      {importMutation.error ? <MutationErrorAlert error={importMutation.error} /> : null}
      {updateMutation.error ? <MutationErrorAlert error={updateMutation.error} /> : null}
      {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[8rem]">{t("admin.eventStages.table.beatmapId")}</TableHead>
                  <TableHead className="w-[12rem]">{t("admin.eventStages.table.artist")}</TableHead>
                  <TableHead className="min-w-[18rem]">{t("admin.eventStages.table.title")}</TableHead>
                  <TableHead className="w-[12rem]">{t("admin.eventStages.table.mapper")}</TableHead>
                  <TableHead className="w-[10rem]">{t("admin.eventStages.table.bg")}</TableHead>
                  <TableHead className="w-[11rem] text-right">{t("admin.eventStages.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagesQuery.isLoading ? <StageSkeletonRows /> : null}
                {!stagesQuery.isLoading && (stagesQuery.data?.data.length ?? 0) === 0 && !hasNewStages ? (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={6}>
                      {t("admin.eventStages.table.noStages")}
                    </TableCell>
                  </TableRow>
                ) : null}
                {stagesQuery.data?.data.map((stage, index) => (
                  <ExistingStageRow
                    draft={editingDrafts[stage.id]}
                    index={index}
                    isDeleting={deleteMutation.isPending && deletingStage?.id === stage.id}
                    isUpdating={updateMutation.isPending}
                    key={stage.id}
                    onCancel={() => setEditingDrafts((current) => omitKey(current, stage.id))}
                    onChange={(draft) => setEditingDrafts((current) => ({ ...current, [stage.id]: draft }))}
                    onDelete={() => setDeletingStage(stage)}
                    onEdit={() => setEditingDrafts((current) => ({ ...current, [stage.id]: stageToDraft(stage) }))}
                    onSave={(draft) => {
                      updateMutation.mutate({
                        stageId: stage.id,
                        request: draftToMutationRequest(draft),
                      }, {
                        onSuccess: () => {
                          toast.success(t("admin.eventStages.updated"))
                          setEditingDrafts((current) => omitKey(current, stage.id))
                        },
                      })
                    }}
                    stage={stage}
                  />
                ))}
                {newStages.map((stage, index) => (
                  <NewStageRow
                    index={(stagesQuery.data?.data.length ?? 0) + index}
                    key={stage.id}
                    onChange={(nextStage) => {
                      setNewStages((current) => current.map((item) => (item.id === stage.id ? nextStage : item)))
                    }}
                    onRemove={() => setNewStages((current) => current.filter((item) => item.id !== stage.id))}
                    stage={stage}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteStageDialog
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (!deletingStage) return

          deleteMutation.mutate(deletingStage.id, {
            onSuccess: () => {
              toast.success(t("admin.eventStages.deleted"))
              setDeletingStage(null)
            },
          })
        }}
        onOpenChange={(open) => {
          if (!open) setDeletingStage(null)
        }}
        stage={deletingStage}
      />
    </div>
  )
}

type ExistingStageRowProps = {
  draft: ExistingStageDraft | undefined
  index: number
  isDeleting: boolean
  isUpdating: boolean
  onCancel: () => void
  onChange: (draft: ExistingStageDraft) => void
  onDelete: () => void
  onEdit: () => void
  onSave: (draft: ExistingStageDraft) => void
  stage: EventStageSummary
}

function ExistingStageRow({
  draft,
  index,
  isDeleting,
  isUpdating,
  onCancel,
  onChange,
  onDelete,
  onEdit,
  onSave,
  stage,
}: ExistingStageRowProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(draft)
  const value = draft ?? stageToDraft(stage)

  return (
    <TableRow>
      <TableCell>
        <StageInput
          disabled={!isEditing || isUpdating}
          inputMode="numeric"
          value={value.map_id}
          onChange={(mapId) => onChange({ ...value, map_id: mapId })}
        />
      </TableCell>
      <TableCell>
        <StageInput
          disabled={!isEditing || isUpdating}
          value={value.artist}
          onChange={(artist) => onChange({ ...value, artist })}
        />
      </TableCell>
      <TableCell>
        <StageInput
          disabled={!isEditing || isUpdating}
          value={value.title}
          onChange={(title) => onChange({ ...value, title })}
        />
      </TableCell>
      <TableCell>
        <StageInput
          disabled={!isEditing || isUpdating}
          value={value.mapper}
          onChange={(mapper) => onChange({ ...value, mapper })}
        />
      </TableCell>
      <TableCell>
        {stage.url ? (
          <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={stage.url} rel="noreferrer" target="_blank">
            {t("admin.eventStages.table.bgLabel", { index: index + 1 })}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">{t("admin.eventStages.table.noBg")}</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button disabled={isUpdating} onClick={() => onSave(value)} size="sm" type="button">
                {t("admin.eventStages.table.save")}
              </Button>
              <Button disabled={isUpdating} onClick={onCancel} size="sm" type="button" variant="outline">
                {t("admin.eventStages.table.cancel")}
              </Button>
            </>
          ) : (
            <Button onClick={onEdit} size="sm" type="button" variant="outline">
              {t("admin.eventStages.table.edit")}
            </Button>
          )}
          <Button disabled={isDeleting} onClick={onDelete} size="icon-sm" type="button" variant="destructive">
            <Trash className="size-4" weight="bold" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

type NewStageRowProps = {
  index: number
  onChange: (stage: EditableStage) => void
  onRemove: () => void
  stage: EditableStage
}

function NewStageRow({ index, onChange, onRemove, stage }: NewStageRowProps) {
  const { t } = useTranslation()
  const fileId = `stage-bg-${stage.id}`

  return (
    <TableRow className="bg-muted/20">
      <TableCell>
        <StageInput inputMode="numeric" value={stage.map_id} onChange={(mapId) => onChange({ ...stage, map_id: mapId })} />
      </TableCell>
      <TableCell>
        <StageInput value={stage.artist} onChange={(artist) => onChange({ ...stage, artist })} />
      </TableCell>
      <TableCell>
        <StageInput value={stage.title} onChange={(title) => onChange({ ...stage, title })} />
      </TableCell>
      <TableCell>
        <StageInput value={stage.mapper} onChange={(mapper) => onChange({ ...stage, mapper })} />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Label className="sr-only" htmlFor={fileId}>{t("admin.eventStages.newRow.bgAria", { index: index + 1 })}</Label>
          <Input
            accept="image/*"
            id={fileId}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null

              if (file && file.size > MAX_BG_SIZE) {
                toast.error(t("admin.eventStages.newRow.bgTooLarge"))
                event.currentTarget.value = ""
                onChange({ ...stage, file: null })
                return
              }

              onChange({ ...stage, file })
            }}
            type="file"
          />
          <p className="line-clamp-1 text-xs text-muted-foreground">{stage.file?.name ?? t("admin.eventStages.newRow.requiredHint")}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Button onClick={onRemove} size="icon-sm" type="button" variant="ghost">
            <Trash className="size-4" weight="bold" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function StageInput({
  disabled = false,
  inputMode,
  onChange,
  value,
}: {
  disabled?: boolean
  inputMode?: "numeric"
  onChange: (value: string) => void
  value: string
}) {
  return (
    <Input
      className="h-8"
      disabled={disabled}
      inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  )
}

function StageSkeletonRows() {
  return Array.from({ length: 4 }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 6 }, (_, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className="h-8 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ))
}

type DeleteStageDialogProps = {
  isDeleting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  stage: EventStageSummary | null
}

function DeleteStageDialog({ isDeleting, onConfirm, onOpenChange, stage }: DeleteStageDialogProps) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={Boolean(stage)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.eventStages.deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.eventStages.deleteDialog.description", { name: stage?.title ?? t("admin.eventStages.deleteDialog.fallbackTitle") })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("admin.eventStages.table.cancel")}</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting} onClick={onConfirm}>
            {t("admin.eventStages.table.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function stageToDraft(stage: EventStageSummary): ExistingStageDraft {
  return {
    artist: stage.artist ?? "",
    map_id: String(stage.map_id ?? ""),
    mapper: stage.mapper ?? "",
    title: stage.title ?? "",
  }
}

function draftToMutationRequest(draft: ExistingStageDraft): EventStageMutationRequest {
  return {
    artist: draft.artist.trim(),
    desc: "",
    map_id: Number(draft.map_id),
    mapper: draft.mapper.trim(),
    title: draft.title.trim(),
  }
}

function toStageMutationRequest(stage: EditableStage): EventStageMutationRequest {
  return {
    artist: stage.artist.trim(),
    desc: "",
    map_id: Number(stage.map_id),
    mapper: stage.mapper.trim(),
    title: stage.title.trim(),
  }
}

function isValidStageDraft(stage: Pick<EditableStage, "artist" | "map_id" | "mapper" | "title">) {
  return Boolean(
    stage.title.trim()
    && Number.isInteger(Number(stage.map_id))
    && Number(stage.map_id) > 0,
  )
}

function omitKey<T extends Record<number, unknown>>(record: T, key: number): T {
  const next = { ...record }
  delete next[key]
  return next
}

function loadStageDraft(eventId: string): EditableStage[] {
  if (!eventId || typeof window === "undefined") return []

  try {
    const rawDraft = window.sessionStorage.getItem(`${STAGE_DRAFT_STORAGE_PREFIX}${eventId}`)
    if (!rawDraft) return []
    const parsedDraft: unknown = JSON.parse(rawDraft)
    if (!Array.isArray(parsedDraft)) return []

    return parsedDraft.flatMap((item) => {
      if (!isStoredStageDraft(item)) return []
      return [{
        artist: item.artist,
        file: null,
        id: item.id || crypto.randomUUID(),
        map_id: item.map_id,
        mapper: item.mapper,
        title: item.title,
      }]
    })
  } catch {
    return []
  }
}

function saveStageDraft(eventId: string, stages: EditableStage[]) {
  if (!eventId || typeof window === "undefined") return

  const storageKey = `${STAGE_DRAFT_STORAGE_PREFIX}${eventId}`
  try {
    if (stages.length === 0) {
      window.sessionStorage.removeItem(storageKey)
      return
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(stages.map((stage) => ({
      artist: stage.artist,
      id: stage.id,
      map_id: stage.map_id,
      mapper: stage.mapper,
      title: stage.title,
    }))))
  } catch {
    // Storage can be unavailable in private browsing or when the quota is exhausted.
  }
}

function isStoredStageDraft(value: unknown): value is Omit<EditableStage, "file"> {
  if (!value || typeof value !== "object") return false
  const draft = value as Record<string, unknown>
  return ["artist", "id", "map_id", "mapper", "title"].every((key) => typeof draft[key] === "string")
}

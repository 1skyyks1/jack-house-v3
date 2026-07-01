import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, PencilSimple, Plus, Rows, Trash } from "@phosphor-icons/react"
import type { TFunction } from "i18next"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import {
  getEventStatus,
  useCreateEventMutation,
  useDeleteEventMutation,
  useEventDetailQuery,
  useEventListQuery,
  useUpdateEventMutation,
  type EventItem,
  type EventMutationRequest,
} from "@/entities/event"
import { LazyRichTextEditor } from "@/features/rich-text/editor/LazyRichTextEditor"
import { AdminPage, AdminPagination } from "@/features/admin-shell"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { i18n } from "@/shared/i18n/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DateTimePicker } from "@/shared/components/DateTimePicker"
import { FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 8

const createEventSchema = (t: TFunction) => z.object({
  desc: z.string(),
  end: z.string().trim().min(1, t("admin.events.validation.endRequired")),
  name: z.string().trim().min(1, t("admin.events.validation.nameRequired")).max(255, t("admin.events.validation.nameMax")),
  start: z.string().trim().min(1, t("admin.events.validation.startRequired")),
}).superRefine((values, context) => {
  const start = new Date(values.start)
  const end = new Date(values.end)

  if (Number.isNaN(start.getTime())) {
    context.addIssue({
      code: "custom",
      message: t("admin.events.validation.startInvalid"),
      path: ["start"],
    })
  }

  if (Number.isNaN(end.getTime())) {
    context.addIssue({
      code: "custom",
      message: t("admin.events.validation.endInvalid"),
      path: ["end"],
    })
  }

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start >= end) {
    context.addIssue({
      code: "custom",
      message: t("admin.events.validation.endAfterStart"),
      path: ["end"],
    })
  }
})

type EventFormValues = z.infer<ReturnType<typeof createEventSchema>>

const defaultValues: EventFormValues = {
  desc: "",
  end: "",
  name: "",
  start: "",
}

export function AdminEventsPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const [isActiveOnly, setIsActiveOnly] = useState(false)
  const eventsQuery = useEventListQuery({ isActive: isActiveOnly, isClosest: false, page, pageSize: PAGE_SIZE })
  const createMutation = useCreateEventMutation()
  const deleteMutation = useDeleteEventMutation()
  const form = useForm<EventFormValues>({
    defaultValues,
    resolver: zodResolver(createEventSchema(t)),
  })
  const createDialog = useDisclosure()
  const editDialog = useDisclosure()
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null)
  const editEventQuery = useEventDetailQuery(editingEventId ?? undefined)
  const updateMutation = useUpdateEventMutation(editingEventId ?? "")
  const isMutating = createMutation.isPending || updateMutation.isPending

  const openCreateDialog = () => {
    form.reset(defaultValues)
    setEditingEventId(null)
    createDialog.open()
  }

  const openEditDialog = (eventId: number) => {
    form.reset(defaultValues)
    setEditingEventId(String(eventId))
    editDialog.open()
  }

  const closeDialogs = () => {
    createDialog.close()
    editDialog.close()
    setEditingEventId(null)
    form.reset(defaultValues)
  }

  const submitCreate = form.handleSubmit((values) => {
    createMutation.mutate(toEventMutationRequest(values), {
      onSuccess: () => {
        toast.success(t("admin.events.createSuccess"))
        closeDialogs()
      },
    })
  })

  const submitEdit = form.handleSubmit((values) => {
    if (!editingEventId) return

    updateMutation.mutate(toEventMutationRequest(values), {
      onSuccess: () => {
        toast.success(t("admin.events.updateSuccess"))
        closeDialogs()
      },
    })
  })

  if (eventsQuery.isError) {
    return <PageState title={t("admin.events.loadFailedTitle")} description={getErrorMessage(eventsQuery.error)} />
  }

  return (
    <AdminPage
      actions={(
        <Button onClick={openCreateDialog} type="button">
          <Plus className="size-4" weight="bold" />
          {t("admin.events.create")}
        </Button>
      )}
    >
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{t("admin.events.cardTitle")}</CardTitle>
          </div>
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2">
            <Switch
              checked={isActiveOnly}
              disabled={eventsQuery.isFetching}
              id="active-events-only"
              onCheckedChange={(checked) => {
                setIsActiveOnly(checked)
                setPage(1)
              }}
            />
            <Label className="cursor-pointer text-sm font-medium" htmlFor="active-events-only">
              {t("admin.events.activeOnly")}
            </Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventTable
            events={eventsQuery.data?.data ?? []}
            isLoading={eventsQuery.isLoading}
            onDelete={setDeletingEvent}
            onEdit={(event) => openEditDialog(event.id)}
          />
          {eventsQuery.data ? (
            <AdminPagination
              onPageChange={setPage}
              page={eventsQuery.data.page}
              total={eventsQuery.data.total}
              totalPages={eventsQuery.data.totalPages}
            />
          ) : null}
          {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
        </CardContent>
      </Card>

      <EventDialog
        error={createMutation.error}
        form={form}
        isLoading={false}
        isOpen={createDialog.isOpen}
        isSubmitting={isMutating}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
        onSubmit={submitCreate}
        submitLabel={t("admin.events.dialog.createSubmit")}
        title={t("admin.events.dialog.createTitle")}
      />

      <EventDialog
        error={updateMutation.error}
        form={form}
        isLoading={editEventQuery.isLoading}
        isOpen={editDialog.isOpen}
        isSubmitting={isMutating}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
        onSubmit={submitEdit}
        submitLabel={t("admin.events.dialog.editSubmit")}
        title={t("admin.events.dialog.editTitle")}
      />

      <DeleteEventDialog
        event={deletingEvent}
        isDeleting={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeletingEvent(null)
        }}
        onConfirm={() => {
          if (!deletingEvent) return

          deleteMutation.mutate(deletingEvent.id, {
            onSuccess: () => {
              toast.success(t("admin.events.deleteSuccess"))
              setDeletingEvent(null)
            },
          })
        }}
      />

      <EditEventLoader
        event={editEventQuery.data}
        form={form}
        isOpen={editDialog.isOpen}
      />
    </AdminPage>
  )
}

type EventTableProps = {
  events: EventItem[]
  isLoading: boolean
  onDelete: (event: EventItem) => void
  onEdit: (event: EventItem) => void
}

function EventTable({ events, isLoading, onDelete, onEdit }: EventTableProps) {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>{t("admin.events.table.name")}</TableHead>
            <TableHead>{t("admin.events.table.status")}</TableHead>
            <TableHead>{t("admin.events.table.start")}</TableHead>
            <TableHead>{t("admin.events.table.end")}</TableHead>
            <TableHead>{t("admin.events.table.stages")}</TableHead>
            <TableHead className="text-right">{t("admin.events.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <EventTableSkeleton />
          ) : events.length > 0 ? (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-xs">{event.id}</TableCell>
                <TableCell>
                  <div className="min-w-72">
                    <div className="font-medium">{event.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{event.desc ? t("admin.events.table.descriptionSet") : t("admin.events.table.noDescription")}</div>
                  </div>
                </TableCell>
                <TableCell><EventStatusBadge event={event} /></TableCell>
                <TableCell>{formatDateTime(event.start)}</TableCell>
                <TableCell>{formatDateTime(event.end)}</TableCell>
                <TableCell>{event.stage?.length ?? 0}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/event/${event.id}`}>
                        <Eye className="size-3.5" weight="bold" />
                        {t("admin.events.actions.view")}
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/events/${event.id}/stage`}>
                        <Rows className="size-3.5" weight="bold" />
                        {t("admin.events.actions.stages")}
                      </Link>
                    </Button>
                    <Button onClick={() => onEdit(event)} size="sm" type="button" variant="outline">
                      <PencilSimple className="size-3.5" weight="bold" />
                      {t("admin.events.actions.edit")}
                    </Button>
                    <Button onClick={() => onDelete(event)} size="sm" type="button" variant="destructive">
                      <Trash className="size-3.5" weight="bold" />
                      {t("admin.events.actions.delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-10 text-center text-muted-foreground" colSpan={7}>
                {t("admin.events.table.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function EventTableSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-72" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
      <TableCell><Skeleton className="h-5 w-10" /></TableCell>
      <TableCell><Skeleton className="ml-auto h-8 w-72" /></TableCell>
    </TableRow>
  ))
}

function EventStatusBadge({ event }: { event: EventItem }) {
  const { t } = useTranslation()
  const status = getEventStatus(event)

  if (status.tone === "success") return <Badge className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">{t("admin.events.status.active")}</Badge>
  if (status.tone === "info") return <Badge variant="secondary">{t("admin.events.status.upcoming")}</Badge>
  return <Badge variant="outline">{status.label}</Badge>
}

type EventDialogProps = {
  error: unknown
  form: UseFormReturn<EventFormValues>
  isLoading: boolean
  isOpen: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  submitLabel: string
  title: string
}

function EventDialog({ error, form, isLoading, isOpen, isSubmitting, onOpenChange, onSubmit, submitLabel, title }: EventDialogProps) {
  const { t } = useTranslation()
  const startValue = useWatch({ control: form.control, name: "start" })
  const endValue = useWatch({ control: form.control, name: "end" })

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("admin.events.dialog.description")}</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <form className="space-y-5" onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}>
            <div>
              <Label htmlFor="event-name">{t("admin.events.fields.name")}</Label>
              <Input
                aria-invalid={Boolean(form.formState.errors.name)}
                className="mt-2"
                disabled={isSubmitting}
                id="event-name"
                placeholder={t("admin.events.fields.namePlaceholder")}
                {...form.register("name")}
              />
              <FormFieldError message={form.formState.errors.name?.message} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="event-start">{t("admin.events.fields.start")}</Label>
                <DateTimePicker
                  aria-invalid={Boolean(form.formState.errors.start)}
                  className="mt-2"
                  disabled={isSubmitting}
                  id="event-start"
                  placeholder={t("admin.events.fields.start")}
                  value={startValue}
                  onChange={(value) => form.setValue("start", value, { shouldDirty: true, shouldValidate: true })}
                />
                <FormFieldError message={form.formState.errors.start?.message} />
              </div>
              <div>
                <Label htmlFor="event-end">{t("admin.events.fields.end")}</Label>
                <DateTimePicker
                  aria-invalid={Boolean(form.formState.errors.end)}
                  className="mt-2"
                  disabled={isSubmitting}
                  id="event-end"
                  placeholder={t("admin.events.fields.end")}
                  value={endValue}
                  onChange={(value) => form.setValue("end", value, { shouldDirty: true, shouldValidate: true })}
                />
                <FormFieldError message={form.formState.errors.end?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="event-desc">{t("admin.events.fields.description")}</Label>
              <div className="mt-2">
                <Controller
                  control={form.control}
                  name="desc"
                  render={({ field }) => (
                    <LazyRichTextEditor
                      disabled={isSubmitting}
                      id="event-desc"
                      label={t("admin.events.fields.description")}
                      minHeightClassName="min-h-80"
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      placeholder={t("admin.events.fields.descriptionPlaceholder")}
                      value={field.value}
                    />
                  )}
                />
              </div>
            </div>

            {error ? <MutationErrorAlert error={error} /> : null}
            <DialogFooter>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? t("admin.events.dialog.saving") : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

type DeleteEventDialogProps = {
  event: EventItem | null
  isDeleting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

function DeleteEventDialog({ event, isDeleting, onConfirm, onOpenChange }: DeleteEventDialogProps) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={Boolean(event)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.events.deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.events.deleteDialog.description", { title: event?.name ?? t("admin.events.deleteDialog.fallbackTitle") })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("user.edit.cancel")}</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting} onClick={onConfirm} variant="destructive">
            {isDeleting ? t("admin.events.actions.deleting") : t("admin.events.actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type EditEventLoaderProps = {
  event: EventItem | undefined
  form: UseFormReturn<EventFormValues>
  isOpen: boolean
}

function EditEventLoader({ event, form, isOpen }: EditEventLoaderProps) {
  useEffect(() => {
    if (!isOpen || !event) return

    form.reset({
      desc: event.desc ?? "",
      end: toDateTimeLocalValue(event.end),
      name: event.name,
      start: toDateTimeLocalValue(event.start),
    })
  }, [event, form, isOpen])

  return null
}

function toEventMutationRequest(values: EventFormValues): EventMutationRequest {
  return {
    desc: values.desc,
    end: new Date(values.end).toISOString(),
    name: values.name.trim(),
    start: new Date(values.start).toISOString(),
  }
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function formatDateTime(value?: string | null) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(i18n.language === "zh" ? "zh-CN" : "en-CA", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function useDisclosure() {
  const [isOpen, setIsOpen] = useState(false)

  return {
    close: () => setIsOpen(false),
    isOpen,
    open: () => setIsOpen(true),
  }
}

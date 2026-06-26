import { zodResolver } from "@hookform/resolvers/zod"
import { FileArrowUp, NotePencil } from "@phosphor-icons/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  formatFileSize,
  getPostFileStatusLabel,
  useMyPostFilesQuery,
  useUpdatePostFileMutation,
  useUploadPostFileMutation,
  type PostFile,
  type PostFileStatus,
} from "@/entities/post-file"
import { useAuthStore } from "@/features/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AppAlert, FormFieldError, getErrorMessage, MutationErrorAlert } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

const createNoteSchema = (t: TFunction) => z.object({
  note: z.string().trim().min(1, t("post.submission.noteValidation.empty")).max(1000, t("post.submission.noteValidation.tooLong")),
})

type NoteFormValues = z.infer<ReturnType<typeof createNoteSchema>>

type PostSubmissionPanelProps = {
  end: string | null
  limit: number | null
  postId: string
}

export function PostSubmissionPanel({ end, limit, postId }: PostSubmissionPanelProps) {
  const { t } = useTranslation()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const filesQuery = useMyPostFilesQuery(postId, isLogged)
  const uploadMutation = useUploadPostFileMutation(postId)
  const updateMutation = useUpdatePostFileMutation(postId)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const canUpload = isSubmissionOpen(end)
  const uploadedCount = filesQuery.data?.length ?? 0
  const remainingSlots = limit === null ? null : Math.max(limit - uploadedCount, 0)

  const uploadFiles = async () => {
    if (!isLogged) {
      openLoginDialog(window.location.pathname + window.location.search)
      return
    }

    if (selectedFiles.length === 0) {
      toast.error(t("post.submission.chooseFile"))
      return
    }

    const filesToUpload = remainingSlots === null ? selectedFiles : selectedFiles.slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      toast.error(t("post.submission.limitReached"))
      return
    }

    try {
      for (const file of filesToUpload) {
        await uploadMutation.mutateAsync(file)
      }
      setSelectedFiles([])
      toast.success(filesToUpload.length === 1 ? t("post.submission.fileUploaded") : t("post.submission.filesUploaded"))
    } catch {
      // The mutation error block renders the backend message.
    }
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FileArrowUp className="size-4" weight="bold" />
            {t("post.submission.eyebrow")}
          </p>
          <h2 className="mt-2 font-heading text-2xl font-semibold">{t("post.submission.title")}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("post.submission.description")}
          </p>
        </div>
        <SubmissionStateBadge end={end} />
      </div>

      {canUpload ? (
        <div className="mt-5 rounded-lg border border-dashed bg-background p-4">
          <Input
            className="cursor-pointer bg-card"
            disabled={uploadMutation.isPending}
            multiple
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            type="file"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFiles.length === 0
                ? t("post.submission.noFilesSelected")
                : t("post.submission.filesSelected", { count: selectedFiles.length })}
              {remainingSlots !== null ? `, ${t("post.submission.slotsRemaining", { count: remainingSlots })}` : ""}
            </p>
            <Button
              disabled={uploadMutation.isPending || !isLogged || selectedFiles.length === 0 || remainingSlots === 0}
              onClick={uploadFiles}
              type="button"
            >
              <FileArrowUp className="size-4" weight="bold" />
              {uploadMutation.isPending ? t("post.submission.uploading") : isLogged ? t("post.submission.upload") : t("post.submission.loginToUpload")}
            </Button>
          </div>
          {remainingSlots === 0 ? (
            <AppAlert className="mt-3" tone="warning">
              {t("post.submission.limitAlert")}
            </AppAlert>
          ) : null}
        </div>
      ) : (
        <AppAlert className="mt-5">
          {t("post.submission.requestClosed")}
        </AppAlert>
      )}

      {uploadMutation.error ? <MutationErrorAlert className="mt-4" error={uploadMutation.error} /> : null}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-heading text-xl font-semibold">{t("post.submission.mySubmissions")}</h3>
          {filesQuery.data ? <span className="text-sm text-muted-foreground">{t("common.totalCount", { count: filesQuery.data.length })}</span> : null}
        </div>

        <div className="mt-3 divide-y overflow-hidden rounded-lg border">
          {!isLogged ? (
            <SubmissionState title={t("post.submission.loginRequiredTitle")} description={t("post.submission.loginRequiredDescription")} />
          ) : filesQuery.isLoading ? (
            <SubmissionSkeleton />
          ) : filesQuery.isError ? (
            <SubmissionState title={t("post.submission.loadFailedTitle")} description={getErrorMessage(filesQuery.error)} />
          ) : filesQuery.data && filesQuery.data.length > 0 ? (
            filesQuery.data.map((file) => (
              <SubmissionFileItem
                file={file}
                isUpdating={updateMutation.isPending}
                key={file.file_id}
                onSaveNote={(fileId, note) => {
                  updateMutation.mutate(
                    { fileId, request: { note } },
                    { onSuccess: () => toast.success(t("post.submission.noteSaved")) },
                  )
                }}
              />
            ))
          ) : (
            <SubmissionState title={t("post.submission.emptyTitle")} description={t("post.submission.emptyDescription")} />
          )}
        </div>
        {updateMutation.error ? <MutationErrorAlert className="mt-4" error={updateMutation.error} /> : null}
      </div>
    </section>
  )
}

type SubmissionFileItemProps = {
  file: PostFile
  isUpdating: boolean
  onSaveNote: (fileId: number, note: string) => void
}

function SubmissionFileItem({ file, isUpdating, onSaveNote }: SubmissionFileItemProps) {
  const { t } = useTranslation()
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(createNoteSchema(t)),
    defaultValues: { note: "" },
  })

  const submitNote = form.handleSubmit((values) => {
    onSaveNote(file.file_id, values.note.trim())
    form.reset()
  })

  return (
    <article className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words font-medium">{file.file_name}</h4>
            <PostFileStatusBadge status={file.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatFileSize(file.size)} · {formatDate(file.uploaded_time)}
          </p>
          {file.note ? <p className="mt-3 rounded-md bg-muted p-3 text-sm">{t("post.submission.noteLabel")}: {file.note}</p> : null}
          {file.feedback ? <p className="mt-3 rounded-md bg-muted p-3 text-sm">{t("post.submission.feedbackLabel")}: {file.feedback}</p> : null}
        </div>
      </div>

      {!file.note ? (
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submitNote}>
          <div className="min-w-0 flex-1">
            <Input
              disabled={isUpdating}
              placeholder={t("post.submission.notePlaceholder")}
              aria-invalid={Boolean(form.formState.errors.note)}
              {...form.register("note")}
            />
            <FormFieldError message={form.formState.errors.note?.message} />
          </div>
          <Button
            disabled={isUpdating}
            type="submit"
            variant="outline"
          >
            <NotePencil className="size-4" weight="bold" />
            {t("post.submission.saveNote")}
          </Button>
        </form>
      ) : null}
    </article>
  )
}

type PostFileStatusBadgeProps = {
  status: PostFileStatus
}

function PostFileStatusBadge({ status }: PostFileStatusBadgeProps) {
  const className = {
    0: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    1: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    2: "border-destructive/25 bg-destructive/10 text-destructive",
  }[status]

  return (
    <Badge className={className} variant="outline">
      {getPostFileStatusLabel(status)}
    </Badge>
  )
}

type SubmissionStateBadgeProps = {
  end: string | null
}

function SubmissionStateBadge({ end }: SubmissionStateBadgeProps) {
  const { t } = useTranslation()
  const open = isSubmissionOpen(end)

  return (
    <Badge
      className={cn(
        open
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-destructive/25 bg-destructive/10 text-destructive",
      )}
      variant="outline"
    >
      {open ? t("post.submission.open") : t("post.submission.closed")}
    </Badge>
  )
}

type SubmissionStateProps = {
  description: string
  title: string
}

function SubmissionState({ description, title }: SubmissionStateProps) {
  return (
    <div className="p-6 text-center">
      <h4 className="font-heading text-lg font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function SubmissionSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 2 }, (_, index) => (
        <div className="space-y-2" key={index}>
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function isSubmissionOpen(end: string | null) {
  if (!end) return false

  const endDate = new Date(end)
  if (Number.isNaN(endDate.getTime())) return false

  return Date.now() < endDate.getTime()
}

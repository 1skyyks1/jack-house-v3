import { zodResolver } from "@hookform/resolvers/zod"
import { DotsThree, File as FileIcon, FileArrowUp, LockKey, NotePencil, Trash } from "@phosphor-icons/react"
import { useEffect, useId, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  formatFileSize,
  formatPostFileLockCountdown,
  getPostFileLockRemainingMs,
  getPostFileStatusLabel,
  isPostFileLocked,
  useDeletePostFileMutation,
  useMyPostFilesQuery,
  useUpdatePostFileMutation,
  useUploadPostFileMutation,
  type PostFile,
  type PostFileStatus,
} from "@/entities/post-file"
import { useAuthStore } from "@/features/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AppAlert, FormFieldError, MutationErrorAlert } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"

const createNoteSchema = (t: TFunction) => z.object({
  note: z.string().trim().min(1, t("post.submission.noteValidation.empty")).max(1000, t("post.submission.noteValidation.tooLong")),
})

type NoteFormValues = z.infer<ReturnType<typeof createNoteSchema>>

const POST_SUBMISSION_INITIAL_TIME = Date.now()

type FileUploadState = {
  progress: number
  status: "pending" | "uploading" | "processing" | "complete" | "error"
}

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
  const deleteMutation = useDeletePostFileMutation()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadStates, setUploadStates] = useState<Record<number, FileUploadState>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [now, setNow] = useState(POST_SUBMISSION_INITIAL_TIME)
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUpload = isSubmissionOpen(end)
  const uploadedCount = filesQuery.data?.length ?? 0
  const remainingSlots = limit === null ? null : Math.max(limit - uploadedCount, 0)
  const isCheckingUploadLimit = isLogged && limit !== null && filesQuery.isLoading

  useEffect(() => {
    if (!filesQuery.data?.length) return
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [filesQuery.data])

  const selectFiles = (files: File[]) => {
    setSelectedFiles(files)
    setUploadStates({})
  }

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

    let activeIndex: number | null = null

    setUploadStates(Object.fromEntries(filesToUpload.map((_, index) => [index, { progress: 0, status: "pending" }])))

    try {
      for (const [index, file] of filesToUpload.entries()) {
        activeIndex = index
        setUploadStates((states) => ({ ...states, [index]: { progress: 0, status: "uploading" } }))
        await uploadMutation.mutateAsync({
          file,
          onUploadProgress: (progress) => {
            setUploadStates((states) => ({
              ...states,
              [index]: { progress, status: progress >= 100 ? "processing" : "uploading" },
            }))
          },
        })
        setUploadStates((states) => ({ ...states, [index]: { progress: 100, status: "complete" } }))
      }
      setSelectedFiles([])
      setUploadStates({})
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast.success(filesToUpload.length === 1 ? t("post.submission.fileUploaded") : t("post.submission.filesUploaded"))
    } catch {
      if (activeIndex !== null) {
        const failedIndex = activeIndex
        setUploadStates((states) => ({
          ...states,
          [failedIndex]: { progress: states[failedIndex]?.progress ?? 0, status: "error" },
        }))
      }
      // The mutation error block renders the backend message.
    }
  }

  return (
    <section className="rounded-lg border bg-card p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="inline-flex items-center gap-2 font-heading text-lg font-semibold">
            <FileArrowUp className="size-5 text-muted-foreground" weight="bold" />
            {t("post.submission.eyebrow")}
          </h2>
          <SubmissionStateBadge end={end} />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {t("post.submission.description")}
        </p>
      </div>

      {!canUpload ? (
        <AppAlert className="mt-5">
          {t("post.submission.requestClosed")}
        </AppAlert>
      ) : isCheckingUploadLimit ? null : remainingSlots === 0 ? (
        <AppAlert className="mt-5" tone="warning">
          {t("post.submission.limitAlert")}
        </AppAlert>
      ) : (
        <div className="mt-5">
          <input
            className="sr-only"
            disabled={uploadMutation.isPending}
            id={fileInputId}
            multiple
            onChange={(event) => selectFiles(Array.from(event.target.files ?? []))}
            ref={fileInputRef}
            type="file"
          />
          <label
            aria-disabled={uploadMutation.isPending}
            className={cn(
              "flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition sm:min-h-44 sm:px-6 sm:py-8",
              "border-muted-foreground/25 bg-card hover:border-primary/55 hover:bg-primary/[0.03]",
              isDragging && "border-primary bg-primary/[0.06]",
              uploadMutation.isPending && "pointer-events-none opacity-60",
            )}
            htmlFor={fileInputId}
            onDragEnter={(event) => {
              event.preventDefault()
              if (!uploadMutation.isPending) setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = "copy"
            }}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              if (!uploadMutation.isPending) selectFiles(Array.from(event.dataTransfer.files))
            }}
          >
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <FileArrowUp className="size-7" weight="duotone" />
            </span>
            <span className="mt-4 text-sm text-foreground">
              {t("post.submission.dropPrompt")} <span className="font-medium text-primary">{t("post.submission.browseFiles")}</span>
            </span>
            <span className="mt-2 text-xs text-muted-foreground">{t("post.submission.multipleFilesHint")}</span>
          </label>
          {selectedFiles.length > 0 ? (
            <div className="mt-3 divide-y overflow-hidden rounded-lg border bg-background">
              {selectedFiles.map((file, index) => (
                <SelectedFileRow
                  file={file}
                  isOverLimit={remainingSlots !== null && index >= remainingSlots}
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  state={uploadStates[index]}
                />
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={uploadMutation.isPending || !isLogged || selectedFiles.length === 0 || remainingSlots === 0}
              onClick={uploadFiles}
              type="button"
            >
              <FileArrowUp className="size-4" weight="bold" />
              {uploadMutation.isPending ? t("post.submission.uploading") : isLogged ? t("post.submission.upload") : t("post.submission.loginToUpload")}
            </Button>
          </div>
        </div>
      )}

      {uploadMutation.error ? <MutationErrorAlert className="mt-4" error={uploadMutation.error} /> : null}
      {deleteMutation.error ? <MutationErrorAlert className="mt-4" error={deleteMutation.error} /> : null}

      {filesQuery.data && filesQuery.data.length > 0 ? (
        <>
          <div className="mt-6 space-y-1">
            {filesQuery.data.map((file) => (
              <SubmissionFileItem
                file={file}
                isDeleting={deleteMutation.isPending}
                isUpdating={updateMutation.isPending}
                key={file.file_id}
                now={now}
                onDelete={(fileId) => {
                  deleteMutation.mutate(fileId, {
                    onSuccess: () => toast.success(t("post.submission.fileDeleted")),
                  })
                }}
                onSaveNote={(fileId, note) => {
                  updateMutation.mutate(
                    { fileId, request: { note } },
                    { onSuccess: () => toast.success(t("post.submission.noteSaved")) },
                  )
                }}
              />
            ))}
          </div>
          {updateMutation.error ? <MutationErrorAlert className="mt-4" error={updateMutation.error} /> : null}
        </>
      ) : null}
    </section>
  )
}

type SelectedFileRowProps = {
  file: File
  isOverLimit: boolean
  state?: FileUploadState
}

function SelectedFileRow({ file, isOverLimit, state }: SelectedFileRowProps) {
  const { t } = useTranslation()
  const showProgress = state?.status === "uploading" || state?.status === "processing"
  const statusLabel = isOverLimit
    ? t("post.submission.fileStatus.overLimit")
    : state?.status === "uploading"
      ? t("post.submission.fileStatus.uploading", { progress: state.progress })
      : state?.status === "processing"
        ? t("post.submission.fileStatus.processing")
        : state?.status === "complete"
          ? t("post.submission.fileStatus.complete")
          : state?.status === "error"
            ? t("post.submission.fileStatus.error")
            : null

  return (
    <div className={cn("flex items-start gap-3 px-3 py-3 sm:items-center sm:py-2.5", isOverLimit && "opacity-60")}>
      <FileIcon className="size-5 shrink-0 text-muted-foreground" weight="duotone" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="break-all font-medium sm:truncate" title={file.name}>{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground sm:text-right">
            {statusLabel ?? formatFileSize(file.size)}
          </span>
        </div>
        {showProgress ? (
          <div
            aria-label={statusLabel ?? undefined}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={state.progress}
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className={cn("h-full rounded-full bg-primary transition-[width]", state.status === "processing" && "animate-pulse")}
              style={{ width: `${state.progress}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

type SubmissionFileItemProps = {
  file: PostFile
  isDeleting: boolean
  isUpdating: boolean
  now: number
  onDelete: (fileId: number) => void
  onSaveNote: (fileId: number, note: string) => void
}

function SubmissionFileItem({ file, isDeleting, isUpdating, now, onDelete, onSaveNote }: SubmissionFileItemProps) {
  const { t } = useTranslation()
  const remainingLockMs = getPostFileLockRemainingMs(file, now)
  const locked = isPostFileLocked(file, now)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(createNoteSchema(t)),
    defaultValues: { note: "" },
  })

  const submitNote = form.handleSubmit((values) => {
    onSaveNote(file.file_id, values.note.trim())
    form.reset()
    setIsManageOpen(false)
  })

  const hasActions = !file.note || !locked

  return (
    <article className="group rounded-md px-1 py-3 transition-colors hover:bg-accent/50 sm:px-3">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="min-w-0 max-w-full truncate font-medium" title={file.file_name}>{file.file_name}</h4>
            {locked ? <PostFileStatusBadge status={file.status} /> : null}
            {locked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span aria-label={t("post.submission.locked")} className="inline-flex text-muted-foreground" role="img">
                    <LockKey className="size-4" weight="fill" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("post.submission.locked")}</TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {t("post.submission.locksIn", { countdown: formatPostFileLockCountdown(remainingLockMs) })}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatFileSize(file.size)} · {formatDate(file.uploaded_time)}
          </p>
          {file.note ? <p className="mt-2 break-all border-l-2 border-border pl-3 text-sm text-muted-foreground">{t("post.submission.noteLabel")}: {file.note}</p> : null}
          {file.feedback ? <p className="mt-2 break-all border-l-2 border-border pl-3 text-sm text-muted-foreground">{t("post.submission.feedbackLabel")}: {file.feedback}</p> : null}
        </div>
        {hasActions ? (
          <Dialog
            onOpenChange={(open) => {
              setIsManageOpen(open)
              if (!open) {
                setIsConfirmingDelete(false)
                form.reset()
              }
            }}
            open={isManageOpen}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label={t("post.submission.manage")} className="shrink-0" disabled={isDeleting || isUpdating} onClick={() => setIsManageOpen(true)} size="icon-sm" type="button" variant="ghost">
                  <DotsThree className="size-5" weight="bold" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("post.submission.manage")}</TooltipContent>
            </Tooltip>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("post.submission.manage")}</DialogTitle>
                <DialogDescription className="break-words">{file.file_name}</DialogDescription>
              </DialogHeader>

              {!file.note ? (
                <form className="space-y-3" onSubmit={submitNote}>
                  <p className="font-medium">{t("post.submission.noteLabel")}</p>
                  <div>
                    <Input
                      aria-invalid={Boolean(form.formState.errors.note)}
                      disabled={isUpdating}
                      placeholder={t("post.submission.notePlaceholder")}
                      {...form.register("note")}
                    />
                    <FormFieldError message={form.formState.errors.note?.message} />
                  </div>
                  <DialogFooter>
                    <Button disabled={isUpdating} type="submit" variant="outline">
                      <NotePencil className="size-4" weight="bold" />
                      {t("post.submission.saveNote")}
                    </Button>
                  </DialogFooter>
                </form>
              ) : null}

              {!locked ? (
                <div className="border-t pt-4">
                  {isConfirmingDelete ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {t("post.submission.deleteDialog.description", { name: file.file_name })}
                      </p>
                      <DialogFooter>
                        <Button onClick={() => setIsConfirmingDelete(false)} type="button" variant="outline">
                          {t("post.submission.deleteDialog.cancel")}
                        </Button>
                        <Button
                          disabled={isDeleting}
                          onClick={() => {
                            onDelete(file.file_id)
                            setIsConfirmingDelete(false)
                            setIsManageOpen(false)
                          }}
                          type="button"
                          variant="destructive"
                        >
                          <Trash className="size-4" weight="bold" />
                          {t("post.submission.delete")}
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <Button onClick={() => setIsConfirmingDelete(true)} type="button" variant="destructive">
                      <Trash className="size-4" weight="bold" />
                      {t("post.submission.delete")}
                    </Button>
                  )}
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
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

function isSubmissionOpen(end: string | null) {
  if (!end) return false

  const endDate = new Date(end)
  if (Number.isNaN(endDate.getTime())) return false

  return Date.now() < endDate.getTime()
}

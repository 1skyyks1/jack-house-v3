import { zodResolver } from "@hookform/resolvers/zod"
import type { ColumnDef } from "@tanstack/react-table"
import { DownloadSimpleIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react"
import type { TFunction } from "i18next"
import { useEffect, useRef, useState } from "react"
import type { Resolver } from "react-hook-form"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import {
  formatFileSize,
  getAdminPostFiles,
  getPostFileLockedAt,
  getPostFileStatusLabel,
  isPostFileLocked,
  useAdminPostFilesQuery,
  useDeletePostFileMutation,
  usePostFileDownloadUrlMutation,
  usePostFilesArchiveMutation,
  useReviewPostFileMutation,
  type PostFile,
  type PostFileStatus,
} from "@/entities/post-file"
import { resolvePostListTitle, usePostListQuery, type PostListItem } from "@/entities/post"
import { AdminBadge, AdminPage, AdminPagination, AdminTable } from "@/features/admin-shell"
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
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 13

const createReviewSchema = (t: TFunction) => z.object({
  feedback: z.string().trim().max(1000, t("admin.postFiles.validation.feedbackTooLong")),
  status: z.union([z.literal(1), z.literal(2)]),
})

type ReviewFormValues = {
  feedback: string
  status: 1 | 2
}

type ReviewTarget = {
  fileId: number
  fileName: string
} | null

type ArchiveProgress = {
  completed: number
  total: number
} | null

export function AdminPostFilesPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const [postId, setPostId] = useState<number | null | undefined>(undefined)
  const [status, setStatus] = useState<PostFileStatus | null>(null)
  const [keyword, setKeyword] = useState("")
  const [keywordDraft, setKeywordDraft] = useState("")
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null)
  const [archiveProgress, setArchiveProgress] = useState<ArchiveProgress>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const keywordTimerRef = useRef<number | null>(null)
  const requestPostsQuery = usePostListQuery({ page: 1, pageSize: 100, type: 1 })
  const selectedPostId = postId === undefined ? (requestPostsQuery.data?.data[0]?.post_id ?? null) : postId
  const postFilesQuery = useAdminPostFilesQuery({ keyword, page, pageSize: PAGE_SIZE, post_id: selectedPostId, status })
  const reviewMutation = useReviewPostFileMutation()
  const deleteMutation = useDeletePostFileMutation()
  const downloadMutation = usePostFileDownloadUrlMutation()
  const archiveMutation = usePostFilesArchiveMutation()

  useEffect(() => () => {
    if (keywordTimerRef.current) window.clearTimeout(keywordTimerRef.current)
  }, [])

  useEffect(() => {
    const nextLockTime = (postFilesQuery.data?.data ?? [])
      .filter((file) => !isPostFileLocked(file, now))
      .map((file) => getPostFileLockedAt(file)?.getTime() ?? Number.POSITIVE_INFINITY)
      .reduce((earliest, lockTime) => Math.min(earliest, lockTime), Number.POSITIVE_INFINITY)

    if (!Number.isFinite(nextLockTime)) return

    const delay = Math.min(Math.max(nextLockTime - Date.now() + 50, 0), 2_147_483_647)
    const timeoutId = window.setTimeout(() => setNow(Date.now()), delay)
    return () => window.clearTimeout(timeoutId)
  }, [now, postFilesQuery.data?.data])

  const exportPostFiles = async () => {
    setIsExporting(true)

    try {
      const total = postFilesQuery.data?.total ?? PAGE_SIZE
      const result = await getAdminPostFiles({
        keyword,
        page: 1,
        pageSize: Math.max(total, PAGE_SIZE),
        post_id: selectedPostId,
        status,
      })

      if (result.data.length === 0) {
        toast.info(t("admin.postFiles.noExportData"))
        return
      }

      downloadPostFilesCsv(result.data)
      toast.success(t("admin.postFiles.exportReady"))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  const downloadSelectedPostArchive = () => {
    if (selectedPostId === null) return

    setArchiveProgress(null)
    archiveMutation.mutate({
      postId: selectedPostId,
      onProgress: (completed, total) => setArchiveProgress({ completed, total }),
    }, {
      onSuccess: ({ blob, fileName }) => {
        downloadBlob(blob, fileName)
        toast.success(t("admin.postFiles.archiveReady"))
      },
      onError: (error) => toast.error(getErrorMessage(error)),
      onSettled: () => setArchiveProgress(null),
    })
  }

  const columns: Array<ColumnDef<PostFile>> = [
    {
      header: t("admin.postFiles.table.file"),
      cell: ({ row }) => (
        <div className="w-[40rem] max-w-[40rem]">
          <FileTitle fileName={row.original.file_name} note={row.original.note} />
        </div>
      ),
    },
    {
      accessorKey: "size",
      header: () => <span className="block text-center">{t("admin.postFiles.table.size")}</span>,
      cell: ({ row }) => <span className="block w-18 text-center">{formatFileSize(row.original.size)}</span>,
    },
    {
      accessorKey: "user_name",
      header: () => <span className="block text-center">{t("admin.postFiles.table.submitter")}</span>,
      cell: ({ row }) => (
        <Link
          className="block w-32 truncate text-center font-medium text-primary underline-offset-4 hover:underline"
          to={`/user/${row.original.user_id}`}
        >
          {row.original.user_name ?? `${t("common.unknownUser")} #${row.original.user_id}`}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="block text-center">{t("admin.postFiles.table.status")}</span>,
      cell: ({ row }) => (
        <div className="flex w-24 justify-center">
          {isPostFileLocked(row.original, now)
            ? <StatusWithFeedback feedback={row.original.feedback} status={row.original.status} />
            : <AdminBadge>{t("admin.postFiles.notLocked")}</AdminBadge>}
        </div>
      ),
    },
    {
      accessorKey: "uploaded_time",
      header: () => <span className="block text-center">{t("admin.postFiles.table.uploaded")}</span>,
      cell: ({ row }) => <span className="block w-24 text-center">{formatDate(row.original.uploaded_time)}</span>,
    },
    {
      id: "actions",
      header: () => <span className="block text-center">{t("admin.postFiles.table.actions")}</span>,
      cell: ({ row }) => (
        <div className="flex min-w-64 flex-wrap justify-center gap-2">
          <Button
            disabled={downloadMutation.isPending}
            onClick={() => {
              downloadMutation.mutate(row.original.file_id, {
                onSuccess: async (url) => {
                  try {
                    await downloadRemoteFile(url, row.original.file_name)
                  } catch {
                    toast.error(t("admin.postFiles.downloadFailed"))
                  }
                },
              })
            }}
            size="xs"
            type="button"
            variant="outline"
          >
            <DownloadSimpleIcon data-icon="inline-start" weight="bold" />
            {t("admin.postFiles.actions.download")}
          </Button>
          <Button
            disabled={row.original.status !== 0 || !isPostFileLocked(row.original, now)}
            onClick={() => setReviewTarget({ fileId: row.original.file_id, fileName: row.original.file_name })}
            size="xs"
            type="button"
            variant="outline"
          >
            <WarningCircleIcon data-icon="inline-start" weight="bold" />
            {t("admin.postFiles.actions.review")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={deleteMutation.isPending}
                size="xs"
                type="button"
                variant="destructive"
              >
                <TrashIcon data-icon="inline-start" weight="bold" />
                {t("admin.postFiles.actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("admin.postFiles.deleteDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("admin.postFiles.deleteDialog.description", { name: row.original.file_name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("user.edit.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteMutation.mutate(row.original.file_id, { onSuccess: () => toast.success(t("admin.postFiles.submissionDeleted")) })
                  }}
                  variant="destructive"
                >
                  {t("admin.postFiles.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  const applyFilters = () => {
    setKeyword(keywordDraft)
    setPage(1)
  }

  const updateKeyword = (value: string) => {
    setKeywordDraft(value)
    if (keywordTimerRef.current) window.clearTimeout(keywordTimerRef.current)
    keywordTimerRef.current = window.setTimeout(() => {
      setKeyword(value)
      setPage(1)
    }, 500)
  }

  if (postFilesQuery.isError) {
    return <PageState title={t("admin.postFiles.loadFailedTitle")} description={getErrorMessage(postFilesQuery.error)} />
  }

  return (
    <AdminPage>
      <div className="flex flex-col gap-4">
        <div className="grid gap-2 lg:grid-cols-[14rem_9rem_minmax(18rem,1fr)_auto_auto_auto]">
          <Select
            onValueChange={(value) => {
              setPostId(value === "all" ? null : Number(value))
              applyFilters()
            }}
            value={selectedPostId === null ? "all" : String(selectedPostId)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("admin.postFiles.filters.allRequestPosts")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.postFiles.filters.allRequestPosts")}</SelectItem>
              {(requestPostsQuery.data?.data ?? []).map((post) => (
                <SelectItem key={post.post_id} value={String(post.post_id)}>
                  {resolvePostListTitle(post as PostListItem, "zh")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              setStatus(value === "all" ? null : Number(value) as PostFileStatus)
              applyFilters()
            }}
            value={status === null ? "all" : String(status)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("admin.postFiles.filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.postFiles.filters.allStatuses")}</SelectItem>
              <SelectItem value="0">{getPostFileStatusLabel(0)}</SelectItem>
              <SelectItem value="1">{getPostFileStatusLabel(1)}</SelectItem>
              <SelectItem value="2">{getPostFileStatusLabel(2)}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            onChange={(event) => updateKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyFilters()
            }}
            placeholder={t("admin.postFiles.filters.keywordPlaceholder")}
            value={keywordDraft}
          />
          <Button onClick={applyFilters} type="button" variant="outline">
            {t("admin.postFiles.filters.apply")}
          </Button>
          <Button
            disabled={selectedPostId === null || archiveMutation.isPending}
            onClick={downloadSelectedPostArchive}
            title={selectedPostId === null ? t("admin.postFiles.filters.selectPostToDownload") : undefined}
            type="button"
            variant="outline"
          >
            <DownloadSimpleIcon data-icon="inline-start" weight="bold" />
            {archiveMutation.isPending ? t("admin.postFiles.filters.archiving") : t("admin.postFiles.filters.downloadAll")}
          </Button>
          <Button disabled={isExporting} onClick={exportPostFiles} type="button" variant="outline">
            <DownloadSimpleIcon data-icon="inline-start" weight="bold" />
            {isExporting ? t("admin.postFiles.filters.exporting") : t("admin.postFiles.filters.exportCsv")}
          </Button>
        </div>

        {archiveMutation.isPending ? (
          <ArchiveDownloadProgress progress={archiveProgress} />
        ) : null}

        <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => {
          if (!open) setReviewTarget(null)
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.postFiles.reviewDialog.title")}</DialogTitle>
              <DialogDescription className="break-words">
                {reviewTarget?.fileName}
              </DialogDescription>
            </DialogHeader>
            {reviewTarget ? (
              <ReviewPanel
                key={reviewTarget.fileId}
                isSubmitting={reviewMutation.isPending}
                onClose={() => setReviewTarget(null)}
                onSubmit={(values) => {
                  reviewMutation.mutate(
                    { fileId: reviewTarget.fileId, request: values },
                    {
                      onSuccess: () => {
                        toast.success(t("admin.postFiles.reviewSaved"))
                        setReviewTarget(null)
                      },
                    },
                  )
                }}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <AdminTable columns={columns} data={postFilesQuery.data?.data ?? []} isLoading={postFilesQuery.isLoading} />
        {postFilesQuery.data ? (
          <AdminPagination
            onPageChange={setPage}
            page={postFilesQuery.data.page}
            total={postFilesQuery.data.total}
            totalPages={postFilesQuery.data.totalPages}
          />
        ) : null}
        {reviewMutation.error ? <MutationErrorAlert error={reviewMutation.error} /> : null}
        {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
        {downloadMutation.error ? <MutationErrorAlert error={downloadMutation.error} /> : null}
      </div>
    </AdminPage>
  )
}

function ArchiveDownloadProgress({ progress }: { progress: ArchiveProgress }) {
  const { t } = useTranslation()
  const completed = progress?.completed ?? 0
  const total = progress?.total ?? 0
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div
      aria-label={t("admin.postFiles.filters.archiveProgress", { completed, total })}
      aria-valuemax={total || undefined}
      aria-valuemin={0}
      aria-valuenow={completed}
      className="rounded-lg border bg-card px-4 py-3"
      role="progressbar"
    >
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">
          {total > 0
            ? t("admin.postFiles.filters.archiveProgress", { completed, total })
            : t("admin.postFiles.filters.archiving")}
        </span>
        <span className="tabular-nums text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

type ReviewPanelProps = {
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: ReviewFormValues) => void
}

function ReviewPanel({ isSubmitting, onClose, onSubmit }: ReviewPanelProps) {
  const { t } = useTranslation()
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(createReviewSchema(t)) as Resolver<ReviewFormValues>,
    defaultValues: { feedback: "", status: 1 },
  })
  const statusValue = useWatch({ control: form.control, name: "status" })

  return (
    <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-3 md:grid-cols-[8rem_minmax(0,1fr)]">
        <Label htmlFor="review-status">{t("admin.postFiles.reviewDialog.result")}</Label>
        <Select
          onValueChange={(value) => form.setValue("status", Number(value) as ReviewFormValues["status"], { shouldDirty: true, shouldValidate: true })}
          value={String(statusValue)}
        >
          <SelectTrigger id="review-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t("admin.postFiles.reviewDialog.approve")}</SelectItem>
            <SelectItem value="2">{t("admin.postFiles.reviewDialog.reject")}</SelectItem>
          </SelectContent>
        </Select>
        <Label htmlFor="review-feedback">{t("admin.postFiles.reviewDialog.feedback")}</Label>
        <Textarea
          className="min-h-20"
          id="review-feedback"
          placeholder={t("admin.postFiles.reviewDialog.feedbackPlaceholder")}
          {...form.register("feedback")}
        />
        <DialogFooter className="md:col-start-2">
          <Button
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t("admin.postFiles.reviewDialog.saving") : t("admin.postFiles.reviewDialog.save")}
          </Button>
          <Button onClick={onClose} type="button" variant="outline">
            {t("admin.postFiles.reviewDialog.cancel")}
          </Button>
        </DialogFooter>
      </div>
    </form>
  )
}

function FileTitle({ fileName, note }: { fileName: string; note: string | null }) {
  const content = note?.trim()

  if (!content) {
    return <div className="truncate font-medium">{fileName}</div>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block max-w-full cursor-help truncate font-medium underline decoration-dotted underline-offset-4" tabIndex={0}>
          {fileName}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-pre-wrap">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

function StatusWithFeedback({ feedback, status }: { feedback: string | null; status: PostFileStatus }) {
  const content = feedback?.trim()

  if (!content) {
    return <PostFileStatusBadge status={status} />
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help" tabIndex={0}>
          <PostFileStatusBadge status={status} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-pre-wrap">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

function PostFileStatusBadge({ status }: { status: PostFileStatus }) {
  const tone = status === 0 ? "warning" : status === 1 ? "success" : "danger"
  return <AdminBadge tone={tone}>{getPostFileStatusLabel(status)}</AdminBadge>
}

function downloadPostFilesCsv(files: PostFile[]) {
  const { t } = { t: i18n.t.bind(i18n) }
  const columns = [
    { header: t("admin.postFiles.csv.columns.fileName"), value: (file: PostFile) => file.file_name },
    { header: t("admin.postFiles.csv.columns.submitter"), value: (file: PostFile) => file.user_name ?? `${t("common.unknownUser")} #${file.user_id}` },
    { header: t("admin.postFiles.csv.columns.status"), value: (file: PostFile) => getPostFileStatusLabel(file.status) },
    { header: t("admin.postFiles.csv.columns.note"), value: (file: PostFile) => file.note ?? "" },
    { header: t("admin.postFiles.csv.columns.feedback"), value: (file: PostFile) => file.feedback ?? "" },
    { header: t("admin.postFiles.csv.columns.uploadedAt"), value: (file: PostFile) => formatDate(file.uploaded_time) },
    { header: t("admin.postFiles.csv.columns.size"), value: (file: PostFile) => formatFileSize(file.size) },
  ]
  const rows = [
    columns.map((column) => column.header),
    ...files.map((file) => columns.map((column) => column.value(file))),
  ]
  const csv = `\ufeff${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })

  downloadBlob(blob, t("admin.postFiles.csv.fileName"))
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r\n|\r|\n/g, "\n")
  const safeValue = /^[=+\-@\t\r]/.test(normalized) ? `'${normalized}` : normalized

  if (!/[",\n]/.test(safeValue)) {
    return safeValue
  }

  return `"${safeValue.replace(/"/g, '""')}"`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

async function downloadRemoteFile(url: string, fileName: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`)
  }

  downloadBlob(await response.blob(), fileName)
}

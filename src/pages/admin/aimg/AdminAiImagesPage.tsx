import type { ColumnDef } from "@tanstack/react-table"
import { ArrowClockwise, Eye, MagnifyingGlass, X } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"
import { AdminBadge, AdminPage, AdminPagination, AdminTable } from "@/features/admin-shell"
import {
  useAdminAiImageJobsQuery,
  type AiImageAuditJob,
  type AiImageFileAuditMetadata,
  type AiImageJobStatus,
} from "@/features/ai-image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage, PageState } from "@/shared/components"

const PAGE_SIZE = 20
const JOB_STATUSES: AiImageJobStatus[] = ["submitting", "pending", "running", "done", "failed", "cancelled", "expired"]

export function AdminAiImagesPage() {
  const { i18n, t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedJob, setSelectedJob] = useState<AiImageAuditJob | null>(null)
  const page = parsePositiveInteger(searchParams.get("page")) ?? 1
  const status = parseStatus(searchParams.get("status"))
  const userId = parsePositiveInteger(searchParams.get("userId"))
  const [userIdDraft, setUserIdDraft] = useState(userId ? String(userId) : "")
  const jobsQuery = useAdminAiImageJobsQuery({
    page,
    pageSize: PAGE_SIZE,
    status: status ?? undefined,
    userId: userId ?? undefined,
  })

  const updateFilters = (updates: { status?: AiImageJobStatus | null; userId?: number | null }) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", "1")

    if (updates.status !== undefined) {
      if (updates.status) nextParams.set("status", updates.status)
      else nextParams.delete("status")
    }
    if (updates.userId !== undefined) {
      if (updates.userId) nextParams.set("userId", String(updates.userId))
      else nextParams.delete("userId")
    }
    setSearchParams(nextParams)
  }

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", String(Math.max(1, nextPage)))
    setSearchParams(nextParams)
  }

  const applyUserFilter = () => {
    updateFilters({ userId: parsePositiveInteger(userIdDraft) })
  }

  const clearFilters = () => {
    setUserIdDraft("")
    setSearchParams({ page: "1" })
  }

  const columns: Array<ColumnDef<AiImageAuditJob>> = [
    {
      accessorKey: "createdAt",
      header: t("admin.aiImages.table.created"),
      cell: ({ row }) => <span className="block w-32 text-xs">{formatDateTime(row.original.createdAt, i18n.language)}</span>,
    },
    {
      header: t("admin.aiImages.table.user"),
      cell: ({ row }) => row.original.user ? (
        <div className="w-36">
          <Link className="block truncate font-medium text-primary hover:underline" to={`/user/${row.original.user.user_id}`}>
            {row.original.user.user_name}
          </Link>
          <div className="mt-1 text-xs text-muted-foreground">
            #{row.original.user.user_id} · {t(`admin.aiImages.roles.${resolveRoleKey(row.original.user.role)}`)}
          </div>
        </div>
      ) : (
        <span className="text-muted-foreground">{t("admin.aiImages.unknownUser")}</span>
      ),
    },
    {
      header: t("admin.aiImages.table.prompt"),
      cell: ({ row }) => (
        <div className="w-[24rem] max-w-[24rem]">
          <p className="line-clamp-2 whitespace-pre-wrap font-medium leading-relaxed">{row.original.prompt}</p>
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{row.original.id}</p>
        </div>
      ),
    },
    {
      header: t("admin.aiImages.table.request"),
      cell: ({ row }) => (
        <div className="w-32 space-y-1 text-xs">
          <div>{row.original.requestType === "edit" ? t("aiImage.referenceMode") : t("aiImage.textMode")}</div>
          <div className="font-mono text-muted-foreground">{row.original.size}</div>
        </div>
      ),
    },
    {
      header: t("admin.aiImages.table.inputs"),
      cell: ({ row }) => (
        <div className="w-24 space-y-1 text-xs">
          <div>{t("admin.aiImages.references", { count: row.original.referenceCount })}</div>
          <div className="text-muted-foreground">{row.original.hasMask ? t("admin.aiImages.hasMask") : t("admin.aiImages.noMask")}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("admin.aiImages.table.status"),
      cell: ({ row }) => (
        <div className="w-24 space-y-1">
          <JobStatusBadge status={row.original.status} />
          {row.original.quotaRefunded ? <AdminBadge tone="warning">{t("admin.aiImages.refunded")}</AdminBadge> : null}
        </div>
      ),
    },
    {
      id: "actions",
      header: t("admin.aiImages.table.actions"),
      cell: ({ row }) => (
        <Button onClick={() => setSelectedJob(row.original)} size="xs" type="button" variant="outline">
          <Eye className="size-3.5" weight="bold" />
          {t("admin.aiImages.details")}
        </Button>
      ),
    },
  ]

  if (jobsQuery.isError) {
    return <PageState title={t("admin.aiImages.loadFailedTitle")} description={getErrorMessage(jobsQuery.error)} />
  }

  return (
    <AdminPage>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("admin.aiImages.eyebrow")}</p>
        <h2 className="mt-1 font-heading text-3xl font-semibold">{t("admin.aiImages.title")}</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t("admin.aiImages.description")}</p>
      </header>

      <div className="grid gap-2 rounded-lg border bg-background p-3 md:grid-cols-[12rem_minmax(12rem,1fr)_auto_auto]">
        <Select
          onValueChange={(value) => updateFilters({ status: value === "all" ? null : value as AiImageJobStatus })}
          value={status ?? "all"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("admin.aiImages.filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.aiImages.filters.allStatuses")}</SelectItem>
            {JOB_STATUSES.map((item) => <SelectItem key={item} value={item}>{t(`aiImage.status.${item}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          inputMode="numeric"
          onChange={(event) => setUserIdDraft(event.target.value.replace(/\D/g, ""))}
          onKeyDown={(event) => {
            if (event.key === "Enter") applyUserFilter()
          }}
          placeholder={t("admin.aiImages.filters.userIdPlaceholder")}
          value={userIdDraft}
        />
        <Button onClick={applyUserFilter} type="button" variant="outline">
          <MagnifyingGlass weight="bold" />
          {t("admin.aiImages.filters.apply")}
        </Button>
        <div className="flex gap-2">
          <Button disabled={jobsQuery.isFetching} onClick={() => void jobsQuery.refetch()} type="button" variant="outline">
            <ArrowClockwise className={jobsQuery.isFetching ? "animate-spin" : ""} weight="bold" />
            {t("admin.aiImages.filters.refresh")}
          </Button>
          {(status || userId) ? (
            <Button onClick={clearFilters} type="button" variant="ghost">
              <X weight="bold" />
              {t("admin.aiImages.filters.clear")}
            </Button>
          ) : null}
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={jobsQuery.data?.data ?? []}
        emptyLabel={t("admin.aiImages.empty")}
        isLoading={jobsQuery.isLoading}
      />
      {jobsQuery.data ? (
        <AdminPagination
          onPageChange={setPage}
          page={jobsQuery.data.page}
          total={jobsQuery.data.total}
          totalPages={jobsQuery.data.totalPages}
        />
      ) : null}

      <JobDetailsDialog job={selectedJob} onOpenChange={(open) => {
        if (!open) setSelectedJob(null)
      }} />
    </AdminPage>
  )
}

function JobStatusBadge({ status }: { status: AiImageJobStatus }) {
  const { t } = useTranslation()
  const tone = status === "done" ? "success" : status === "failed" ? "danger" : status === "cancelled" || status === "expired" ? "warning" : "info"
  return <AdminBadge tone={tone}>{t(`aiImage.status.${status}`)}</AdminBadge>
}

function JobDetailsDialog({ job, onOpenChange }: { job: AiImageAuditJob | null; onOpenChange: (open: boolean) => void }) {
  const { i18n, t } = useTranslation()
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(job)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("admin.aiImages.detail.title")}</DialogTitle>
          <DialogDescription>{t("admin.aiImages.detail.description")}</DialogDescription>
        </DialogHeader>
        {job ? (
          <div className="space-y-5">
            <dl className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label={t("admin.aiImages.detail.user")} value={job.user ? `${job.user.user_name} (#${job.user.user_id})` : t("admin.aiImages.unknownUser")} />
              <DetailItem label={t("admin.aiImages.detail.created")} value={formatDateTime(job.createdAt, i18n.language)} />
              <DetailItem label={t("admin.aiImages.detail.status")} value={t(`aiImage.status.${job.status}`)} />
              <DetailItem label={t("admin.aiImages.detail.requestType")} value={job.requestType === "edit" ? t("aiImage.referenceMode") : t("aiImage.textMode")} />
              <DetailItem label={t("admin.aiImages.detail.size")} value={job.size} mono />
              <DetailItem label={t("admin.aiImages.detail.jobId")} value={job.id} mono />
              <DetailItem label={t("admin.aiImages.detail.upstreamJobId")} value={job.upstreamJobId ?? "–"} mono />
              <DetailItem label={t("admin.aiImages.detail.sourceIp")} value={job.audit.sourceIp ?? "–"} mono />
            </dl>

            <DetailSection title={t("admin.aiImages.detail.prompt")}>
              <p className="whitespace-pre-wrap break-words rounded-lg bg-muted/40 p-3 leading-relaxed">{job.prompt}</p>
            </DetailSection>

            {(job.errorCode || job.errorMessage) ? (
              <DetailSection title={t("admin.aiImages.detail.error")}>
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-destructive">
                  <p className="font-mono text-xs">{job.errorCode ?? "–"}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words">{job.errorMessage ?? "–"}</p>
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title={t("admin.aiImages.detail.references")}>
              <FileMetadataList emptyLabel={t("admin.aiImages.detail.noReferences")} files={job.audit.referenceMetadata ?? []} />
            </DetailSection>

            <DetailSection title={t("admin.aiImages.detail.mask")}>
              <FileMetadataList emptyLabel={t("admin.aiImages.detail.noMask")} files={job.audit.maskMetadata ? [job.audit.maskMetadata] : []} />
            </DetailSection>

            <DetailSection title={t("admin.aiImages.detail.userAgent")}>
              <p className="break-all rounded-lg bg-muted/40 p-3 font-mono text-xs">{job.audit.userAgent ?? "–"}</p>
            </DetailSection>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function DetailSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h3 className="mb-2 font-heading text-base font-semibold">{title}</h3>
      {children}
    </section>
  )
}

function DetailItem({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 break-all text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  )
}

function FileMetadataList({ emptyLabel, files }: { emptyLabel: string; files: AiImageFileAuditMetadata[] }) {
  const { t } = useTranslation()
  if (files.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return (
    <div className="space-y-2">
      {files.map((file, index) => (
        <div className="rounded-lg border p-3" key={`${file.sha256}-${index}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="break-all">{file.name}</strong>
            <span className="text-xs text-muted-foreground">{file.mimeType} · {formatBytes(file.size)}</span>
          </div>
          <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{t("admin.aiImages.detail.sha256")}: {file.sha256}</p>
        </div>
      ))}
    </div>
  )
}

function parsePositiveInteger(value: string | null) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

function parseStatus(value: string | null): AiImageJobStatus | null {
  return JOB_STATUSES.includes(value as AiImageJobStatus) ? value as AiImageJobStatus : null
}

function resolveRoleKey(role: number) {
  if (role === 2) return "admin"
  if (role === 1) return "organizer"
  return "user"
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) return "–"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "–"
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(date)
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / 1024 / 1024).toFixed(2)} MB`
}

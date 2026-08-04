import type { ColumnDef } from "@tanstack/react-table"
import { ArrowSquareOut, Check, X } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  usePackFeedbackListQuery,
  useUpdatePackFeedbackStatusMutation,
  type PackFeedback,
  type PackFeedbackStatus,
} from "@/entities/pack"
import { AdminBadge, AdminPage, AdminPagination, AdminTable } from "@/features/admin-shell"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 20

export function AdminPackFeedbackPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const [statusFilter, setStatusFilter] = useState<"all" | `${PackFeedbackStatus}`>("all")
  const status = statusFilter === "all" ? undefined : Number(statusFilter) as PackFeedbackStatus
  const feedbackQuery = usePackFeedbackListQuery({ page, pageSize: PAGE_SIZE, status })
  const updateMutation = useUpdatePackFeedbackStatusMutation()

  const updateStatus = (feedbackId: number, nextStatus: PackFeedbackStatus) => {
    updateMutation.mutate(
      { feedbackId, status: nextStatus },
      { onSuccess: () => toast.success(t("admin.packFeedback.updateSuccess")) },
    )
  }

  const columns: Array<ColumnDef<PackFeedback>> = [
    {
      header: t("admin.packFeedback.columns.pack"),
      cell: ({ row }) => (
        <div className="min-w-48">
          <div className="font-medium">{getPackTitle(row.original)}</div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">#{row.original.pack_id}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t("admin.packFeedback.columns.category"),
      cell: ({ row }) => t(`pack.feedback.categories.${row.original.category}`),
    },
    {
      accessorKey: "content",
      header: t("admin.packFeedback.columns.content"),
      cell: ({ row }) => <p className="min-w-64 max-w-lg whitespace-pre-wrap break-words text-sm leading-6">{row.original.content}</p>,
    },
    {
      header: t("admin.packFeedback.columns.submitter"),
      cell: ({ row }) => row.original.user?.user_name ?? `#${row.original.user_id}`,
    },
    {
      accessorKey: "created_time",
      header: t("admin.packFeedback.columns.created"),
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.created_time)}</span>,
    },
    {
      accessorKey: "status",
      header: t("admin.packFeedback.columns.status"),
      cell: ({ row }) => <FeedbackStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: t("admin.packFeedback.columns.actions"),
      cell: ({ row }) => (
        <div className="flex min-w-52 flex-wrap gap-2">
          <Button asChild size="xs" variant="outline">
            <Link to={`/pack/${row.original.pack_id}`}>
              <ArrowSquareOut className="size-3.5" weight="bold" />
              {t("admin.packFeedback.viewPack")}
            </Link>
          </Button>
          {row.original.status !== 1 ? (
            <Button disabled={updateMutation.isPending} onClick={() => updateStatus(row.original.feedback_id, 1)} size="xs" type="button" variant="outline">
              <Check className="size-3.5" weight="bold" />
              {t("admin.packFeedback.resolve")}
            </Button>
          ) : null}
          {row.original.status !== 2 ? (
            <Button disabled={updateMutation.isPending} onClick={() => updateStatus(row.original.feedback_id, 2)} size="xs" type="button" variant="ghost">
              <X className="size-3.5" weight="bold" />
              {t("admin.packFeedback.dismiss")}
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  if (feedbackQuery.isError) {
    return <PageState title={t("admin.packFeedback.loadFailedTitle")} description={getErrorMessage(feedbackQuery.error)} />
  }

  return (
    <AdminPage
      actions={(
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value as typeof statusFilter)
          setPage(1)
        }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.packFeedback.filters.all")}</SelectItem>
            <SelectItem value="0">{t("admin.packFeedback.status.pending")}</SelectItem>
            <SelectItem value="1">{t("admin.packFeedback.status.resolved")}</SelectItem>
            <SelectItem value="2">{t("admin.packFeedback.status.dismissed")}</SelectItem>
          </SelectContent>
        </Select>
      )}
    >
      <div className="space-y-3">
        <AdminTable columns={columns} data={feedbackQuery.data?.data ?? []} emptyLabel={t("admin.packFeedback.empty")} isLoading={feedbackQuery.isLoading} />
        {feedbackQuery.data ? (
          <AdminPagination
            onPageChange={setPage}
            page={feedbackQuery.data.page}
            total={feedbackQuery.data.total}
            totalPages={feedbackQuery.data.totalPages}
          />
        ) : null}
        {updateMutation.error ? <MutationErrorAlert error={updateMutation.error} /> : null}
      </div>
    </AdminPage>
  )
}

function FeedbackStatusBadge({ status }: { status: PackFeedbackStatus }) {
  const { t } = useTranslation()
  if (status === 1) return <AdminBadge tone="success">{t("admin.packFeedback.status.resolved")}</AdminBadge>
  if (status === 2) return <AdminBadge>{t("admin.packFeedback.status.dismissed")}</AdminBadge>
  return <AdminBadge tone="warning">{t("admin.packFeedback.status.pending")}</AdminBadge>
}

function getPackTitle(feedback: PackFeedback) {
  if (!feedback.pack) return `Pack #${feedback.pack_id}`
  const title = feedback.pack.title_unicode || feedback.pack.title
  const artist = feedback.pack.artist_unicode || feedback.pack.artist
  return artist ? `${artist} - ${title}` : title
}

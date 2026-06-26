import type { ColumnDef } from "@tanstack/react-table"
import { Eye, PencilSimple, Trash } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  resolvePostListTitle,
  useDeletePostMutation,
  usePostListQuery,
  type PostListItem,
  type PostType,
} from "@/entities/post"
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
import { getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 12

export function AdminPostsPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const postsQuery = usePostListQuery({ page, pageSize: PAGE_SIZE, type: -1 })
  const deleteMutation = useDeletePostMutation()

  const columns: Array<ColumnDef<PostListItem>> = [
    {
      accessorKey: "post_id",
      header: t("admin.posts.columns.id"),
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.post_id}</span>,
    },
    {
      header: t("admin.posts.columns.title"),
      cell: ({ row }) => (
        <div className="min-w-64">
          <div className="font-medium">{resolvePostListTitle(row.original, "zh")}</div>
          <div className="mt-1 text-xs text-muted-foreground">{t("admin.posts.columns.byAuthor", { name: row.original.user_name ?? t("common.unknownUser") })}</div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: t("admin.posts.columns.type"),
      cell: ({ row }) => <PostTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "created_time",
      header: t("admin.posts.columns.created"),
      cell: ({ row }) => formatDate(row.original.created_time),
    },
    {
      accessorKey: "updated_time",
      header: t("admin.posts.columns.updated"),
      cell: ({ row }) => formatDate(row.original.updated_time),
    },
    {
      id: "actions",
      header: t("admin.posts.columns.actions"),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <AdminActionLink to={`/post/${row.original.post_id}`}>
            <Eye className="size-3.5" weight="bold" />
            {t("admin.posts.actions.view")}
          </AdminActionLink>
          <AdminActionLink to={`/forum/editor/${row.original.post_id}`}>
            <PencilSimple className="size-3.5" weight="bold" />
            {t("admin.posts.actions.edit")}
          </AdminActionLink>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={deleteMutation.isPending} size="xs" type="button" variant="destructive">
                <Trash className="size-3.5" weight="bold" />
                {t("admin.posts.actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("admin.posts.deleteDialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("admin.posts.deleteDialog.description", { title: resolvePostListTitle(row.original, "zh") })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>{t("user.edit.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    deleteMutation.mutate(row.original.post_id, { onSuccess: () => toast.success(t("admin.posts.deleteDialog.success")) })
                  }}
                  variant="destructive"
                >
                  {deleteMutation.isPending ? t("admin.posts.actions.deleting") : t("admin.posts.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ]

  if (postsQuery.isError) {
    return <PageState title={t("admin.posts.loadFailedTitle")} description={getErrorMessage(postsQuery.error)} />
  }

  return (
    <AdminPage>
      <div className="space-y-3">
        <AdminTable columns={columns} data={postsQuery.data?.data ?? []} isLoading={postsQuery.isLoading} />
        {postsQuery.data ? (
          <AdminPagination
            onPageChange={setPage}
            page={postsQuery.data.page}
            total={postsQuery.data.total}
            totalPages={postsQuery.data.totalPages}
          />
        ) : null}
        {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
      </div>
    </AdminPage>
  )
}

type AdminActionLinkProps = {
  children: React.ReactNode
  to: string
}

function AdminActionLink({ children, to }: AdminActionLinkProps) {
  return (
    <Button asChild size="xs" variant="outline">
      <Link to={to}>{children}</Link>
    </Button>
  )
}

function PostTypeBadge({ type }: { type: PostType }) {
  const { t } = useTranslation()
  switch (type) {
    case 0:
      return <AdminBadge>{t("admin.posts.type.normal")}</AdminBadge>
    case 1:
      return <AdminBadge tone="success">{t("admin.posts.type.request")}</AdminBadge>
    case 2:
      return <AdminBadge tone="warning">{t("admin.posts.type.event")}</AdminBadge>
    case 3:
      return <AdminBadge tone="danger">{t("admin.posts.type.announcement")}</AdminBadge>
  }
}

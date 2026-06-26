import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { NotePencil, Trash } from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  resolvePostContent,
  useDeletePostMutation,
  usePostDetailQuery,
  type PostDetail,
} from "@/entities/post"
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { PostComments } from "@/features/comments"
import { useCurrentUserQuery } from "@/features/auth"
import { RichTextRenderer, RichTextToc } from "@/features/rich-text/renderer"
import { PostSubmissionPanel } from "@/features/uploads"
import type { TocItem } from "@/features/rich-text/model/types"
import { MutationErrorAlert, PageState } from "@/shared/components"
import type { AppLocale } from "@/shared/i18n/client"
import { formatDate } from "@/shared/lib/date"

export function PostDetailPage() {
  const { postId } = useParams()
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const postQuery = usePostDetailQuery(postId)
  const currentUserQuery = useCurrentUserQuery()
  const deleteMutation = useDeletePostMutation()

  if (!postId) {
    return <PageState title={t("post.detail.missingIdTitle")} description={t("post.detail.missingIdDescription")} />
  }

  if (postQuery.isLoading) {
    return <PostDetailSkeleton />
  }

  if (postQuery.isError) {
    const message = postQuery.error instanceof Error ? postQuery.error.message : t("post.detail.loadFailedDescription")
    return <PageState title={t("post.detail.loadFailedTitle")} description={message} />
  }

  if (!postQuery.data) {
    return <PageState title={t("post.detail.notFoundTitle")} description={t("post.detail.notFoundDescription")} />
  }

  const locale = i18n.language === "en" ? "en" : "zh"
  const postContent = resolvePostContent(postQuery.data, locale as AppLocale)
  const canManagePost = canManagePostDetail(postQuery.data, currentUserQuery.data?.user_id, currentUserQuery.data?.role)

  const deletePost = () => {
    deleteMutation.mutate(postQuery.data.post_id, {
      onSuccess: () => {
        toast.success(t("post.detail.deleted"))
        navigate("/forum")
      },
    })
  }

  return (
    <section className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/forum">{t("post.forumLabel")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{postContent.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-6">
          <article className="rounded-lg border bg-card p-5">
            <div className="border-b pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">{t("post.routeMeta", { id: postId })}</p>
                  <h1 className="break-words font-heading text-3xl font-semibold">{postContent.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span>{formatDate(postQuery.data.created_time)}</span>
                    <span>{t("post.byAuthor", { name: postQuery.data.user.user_name })}</span>
                  </div>
                </div>
                {canManagePost ? (
                  <PostDetailActions
                    isDeleting={deleteMutation.isPending}
                    onDelete={deletePost}
                    postId={postQuery.data.post_id}
                  />
                ) : null}
              </div>
              {deleteMutation.isError ? <MutationErrorAlert className="mt-4" error={deleteMutation.error} /> : null}
            </div>
            <div className="mt-6">
              <RichTextRenderer content={postContent.content} emptyLabel={t("post.noContent")} onTocChange={setTocItems} />
            </div>
          </article>
          {postQuery.data.type === 1 ? (
            <PostSubmissionPanel end={postQuery.data.end} limit={postQuery.data.limit} postId={postId} />
          ) : null}
          <PostComments postId={postId} />
        </div>
        <aside className="sticky top-20 hidden lg:block">
          <RichTextToc items={tocItems} />
        </aside>
      </div>
    </section>
  )
}

type PostDetailActionsProps = {
  isDeleting: boolean
  onDelete: () => void
  postId: number
}

function PostDetailActions({ isDeleting, onDelete, postId }: PostDetailActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button asChild size="icon" variant="outline">
        <Link aria-label={t("post.detail.editAriaLabel")} to={`/forum/editor/${postId}`}>
          <NotePencil className="size-4" weight="bold" />
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            aria-label={t("post.detail.deleteAriaLabel")}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isDeleting}
            size="icon"
            type="button"
            variant="outline"
          >
            <Trash className="size-4" weight="bold" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("post.detail.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("post.detail.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("post.detail.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={onDelete} variant="destructive">
              {isDeleting ? t("post.detail.deleting") : t("post.detail.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PostDetailSkeleton() {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <div className="h-5 w-56 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="rounded-lg border bg-card p-5">
          <div className="space-y-4 border-b pb-5">
            <p className="text-sm font-medium text-muted-foreground">{t("post.detail.loading")}</p>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-44 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </article>
        <aside className="hidden rounded-lg border bg-card p-4 lg:block">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </aside>
      </div>
    </section>
  )
}

function canManagePostDetail(post: PostDetail, currentUserId: number | undefined, role: number | undefined) {
  if (currentUserId === undefined) return false

  return role === 2 || post.user_id === currentUserId
}

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  useCreatePostCommentMutation,
  useDeletePostCommentMutation,
  usePostCommentsQuery,
} from "@/entities/comment"
import { useAuthStore, useCurrentUserQuery } from "@/features/auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FormFieldError, getErrorMessage, MutationErrorAlert } from "@/shared/components"
import {
  CommentListItem,
  CommentPagination,
  CommentSkeleton,
  CommentState,
} from "./commentUi"

const PAGE_SIZE = 10

const createCommentSchema = (t: TFunction) => z.object({
  comment: z.string().trim().min(1, t("post.validation.commentEmpty")).max(2000, t("post.validation.commentTooLong")),
})

type CommentFormValues = z.infer<ReturnType<typeof createCommentSchema>>

type PostCommentsProps = {
  postId: string
}

export function PostComments({ postId }: PostCommentsProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const commentsQuery = usePostCommentsQuery({ page, pageSize: PAGE_SIZE, postId })
  const createMutation = useCreatePostCommentMutation(postId, page, PAGE_SIZE)
  const deleteMutation = useDeletePostCommentMutation(postId, page, PAGE_SIZE)
  const currentUserQuery = useCurrentUserQuery()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(createCommentSchema(t)),
    defaultValues: { comment: "" },
  })

  const submitComment = (values: CommentFormValues) => {
    if (!isLogged) {
      openLoginDialog(window.location.pathname + window.location.search)
      return
    }

    createMutation.mutate(
      { comment: values.comment.trim(), post_id: Number(postId) },
      {
        onSuccess: () => {
          form.reset()
          setPage(1)
          toast.success(t("post.commentPosted"))
        },
      },
    )
  }

  const deleteComment = (commentId: number) => {
    deleteMutation.mutate(commentId, {
      onError: (error) => toast.error(getErrorMessage(error)),
      onSuccess: () => toast.success(t("post.commentDeleted")),
    })
  }

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold">{t("post.commentsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("post.commentsDescription")}</p>
        </div>
      </div>

      <form className="mt-5 space-y-3" onSubmit={form.handleSubmit(submitComment)}>
        <Textarea
          className="min-h-24"
          placeholder={isLogged ? t("post.commentPlaceholder") : t("post.commentLoginPlaceholder")}
          aria-invalid={Boolean(form.formState.errors.comment)}
          {...form.register("comment")}
        />
        <FormFieldError message={form.formState.errors.comment?.message} />
        {createMutation.isError ? <MutationErrorAlert error={createMutation.error} /> : null}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? t("post.posting") : isLogged ? t("post.postComment") : t("post.loginToComment")}
          </Button>
        </div>
      </form>

      <div className="mt-6 divide-y rounded-lg border">
        {commentsQuery.isLoading ? (
          <CommentSkeleton />
        ) : commentsQuery.isError ? (
          <CommentState title={t("post.commentsLoadFailed")} description={getErrorMessage(commentsQuery.error)} />
        ) : commentsQuery.data && commentsQuery.data.data.length > 0 ? (
          commentsQuery.data.data.map((comment) => (
            <CommentListItem
              avatar={comment.avatar}
              canDelete={currentUserQuery.data?.role === 2 || currentUserQuery.data?.user_id === comment.user_id}
              content={comment.comment}
              createdTime={comment.created_time}
              isDeleting={deleteMutation.isPending}
              key={comment.comment_id}
              onDelete={() => deleteComment(comment.comment_id)}
              role={comment.role}
              userId={comment.user_id}
              userName={comment.user_name}
            />
          ))
        ) : (
          <CommentState title={t("post.commentsEmptyTitle")} description={t("post.commentsEmptyDescription")} />
        )}
      </div>

      {commentsQuery.data ? (
        <CommentPagination
          onPageChange={setPage}
          page={commentsQuery.data.page}
          totalPages={commentsQuery.data.totalPages}
        />
      ) : null}
    </section>
  )
}

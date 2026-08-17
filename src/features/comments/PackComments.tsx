import { zodResolver } from "@hookform/resolvers/zod"
import { ChatText } from "@phosphor-icons/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"
import {
  useCreatePackCommentMutation,
  useDeletePackCommentMutation,
  usePackCommentsQuery,
} from "@/entities/comment"
import { useAuthStore, useCurrentUserQuery } from "@/features/auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { FormFieldError, getErrorMessage, MutationErrorAlert, SectionTitle } from "@/shared/components"
import {
  CommentListItem,
  CommentPagination,
  CommentSkeleton,
  CommentState,
} from "./commentUi"

const PAGE_SIZE = 10

const createCommentSchema = (t: TFunction) => z.object({
  content: z.string().trim().min(1, t("post.validation.commentEmpty")).max(2000, t("post.validation.commentTooLong")),
})

type CommentFormValues = z.infer<ReturnType<typeof createCommentSchema>>

type PackCommentsProps = {
  packId: string
}

export function PackComments({ packId }: PackCommentsProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const commentsQuery = usePackCommentsQuery({ packId, page, pageSize: PAGE_SIZE })
  const createMutation = useCreatePackCommentMutation(packId, page, PAGE_SIZE)
  const deleteMutation = useDeletePackCommentMutation(packId, page, PAGE_SIZE)
  const currentUserQuery = useCurrentUserQuery()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const isEmpty = !commentsQuery.isLoading && !commentsQuery.isError && commentsQuery.data?.data.length === 0
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(createCommentSchema(t)),
    defaultValues: { content: "" },
  })

  const submitComment = (values: CommentFormValues) => {
    if (!isLogged) {
      openLoginDialog(window.location.pathname + window.location.search)
      return
    }

    createMutation.mutate(
      { content: values.content.trim(), pack_id: Number(packId) },
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
    <section className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle>{t("pack.comments.title")}</SectionTitle>
      </div>

      <form className="mt-5 space-y-3" onSubmit={form.handleSubmit(submitComment)}>
        <Textarea
          className="min-h-24"
          placeholder={isLogged ? t("post.commentPlaceholder") : t("post.commentLoginPlaceholder")}
          aria-invalid={Boolean(form.formState.errors.content)}
          {...form.register("content")}
        />
        <FormFieldError message={form.formState.errors.content?.message} />
        {createMutation.isError ? <MutationErrorAlert error={createMutation.error} /> : null}
        <div className="flex justify-end">
          <Button
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending ? t("post.posting") : isLogged ? t("post.postComment") : t("post.loginToComment")}
          </Button>
        </div>
      </form>

      <div className={cn("mt-6 divide-y", !isEmpty && "rounded-lg border")}>
        {commentsQuery.isLoading ? (
          <CommentSkeleton />
        ) : commentsQuery.isError ? (
          <CommentState title={t("post.commentsLoadFailed")} description={getErrorMessage(commentsQuery.error)} />
        ) : commentsQuery.data && commentsQuery.data.data.length > 0 ? (
          commentsQuery.data.data.map((comment) => (
            <CommentListItem
              avatar={comment.avatar}
              canDelete={currentUserQuery.data?.role === 2 || currentUserQuery.data?.user_id === comment.user_id}
              content={comment.content}
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
          <CommentState
            description={t("post.commentsEmptyDescription")}
            icon={<ChatText weight="duotone" />}
            title={t("post.commentsEmptyTitle")}
          />
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

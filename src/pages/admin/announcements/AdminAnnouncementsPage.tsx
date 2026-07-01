import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import type { TFunction } from "i18next"
import { useEffect, useState } from "react"
import { Controller, useForm, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import {
  resolvePostListTitle,
  useCreatePostMutation,
  useDeletePostMutation,
  usePostDetailQuery,
  usePostListQuery,
  useUpdatePostMutation,
  type PostDetail,
  type PostListItem,
  type PostMutationRequest,
} from "@/entities/post"
import { LazyRichTextEditor } from "@/features/rich-text/editor/LazyRichTextEditor"
import { AdminPage, AdminPagination } from "@/features/admin-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import { usePageParam } from "../_shared/usePageParam"

const PAGE_SIZE = 8

const createAnnouncementSchema = (t: TFunction) => z.object({
  content_en: z.string().trim(),
  content_zh: z.string().trim(),
  title_en: z.string().trim().max(255, t("admin.announcements.validation.titleEnMax")),
  title_zh: z.string().trim().max(255, t("admin.announcements.validation.titleZhMax")),
}).superRefine((values, context) => {
  const hasZh = Boolean(values.title_zh.trim() && stripHtml(values.content_zh).trim())
  const hasEn = Boolean(values.title_en.trim() && stripHtml(values.content_en).trim())

  if (!hasZh && !hasEn) {
    context.addIssue({
      code: "custom",
      message: t("admin.announcements.validation.needOneLanguage"),
      path: ["title_zh"],
    })
  }

  if (values.title_zh.trim() && !stripHtml(values.content_zh).trim()) {
    context.addIssue({
      code: "custom",
      message: t("admin.announcements.validation.zhContentRequired"),
      path: ["content_zh"],
    })
  }

  if (stripHtml(values.content_zh).trim() && !values.title_zh.trim()) {
    context.addIssue({
      code: "custom",
      message: t("admin.announcements.validation.zhTitleRequired"),
      path: ["title_zh"],
    })
  }

  if (values.title_en.trim() && !stripHtml(values.content_en).trim()) {
    context.addIssue({
      code: "custom",
      message: t("admin.announcements.validation.enContentRequired"),
      path: ["content_en"],
    })
  }

  if (stripHtml(values.content_en).trim() && !values.title_en.trim()) {
    context.addIssue({
      code: "custom",
      message: t("admin.announcements.validation.enTitleRequired"),
      path: ["title_en"],
    })
  }
})

type AnnouncementFormValues = z.infer<ReturnType<typeof createAnnouncementSchema>>

const defaultValues: AnnouncementFormValues = {
  content_en: "",
  content_zh: "",
  title_en: "",
  title_zh: "",
}

export function AdminAnnouncementsPage() {
  const { t } = useTranslation()
  const [page, setPage] = usePageParam("page")
  const announcementsQuery = usePostListQuery({ page, pageSize: PAGE_SIZE, type: 3 })
  const createMutation = useCreatePostMutation()
  const deleteMutation = useDeletePostMutation()
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(createAnnouncementSchema(t)),
    defaultValues,
  })
  const createDialog = useDisclosure()
  const editDialog = useDisclosure()
  const [editingPostId, setEditingPostId] = useStringState(null)
  const [deletingPost, setDeletingPost] = usePostState(null)
  const editPostQuery = usePostDetailQuery(editingPostId ?? undefined)
  const updateMutation = useUpdatePostMutation(editingPostId ?? "")
  const isMutating = createMutation.isPending || updateMutation.isPending

  const openCreateDialog = () => {
    form.reset(defaultValues)
    setEditingPostId(null)
    createDialog.open()
  }

  const openEditDialog = (postId: number) => {
    form.reset(defaultValues)
    setEditingPostId(String(postId))
    editDialog.open()
  }

  const closeDialogs = () => {
    createDialog.close()
    editDialog.close()
    setEditingPostId(null)
    form.reset(defaultValues)
  }

  const submitCreate = form.handleSubmit((values) => {
    createMutation.mutate(toAnnouncementMutationRequest(values), {
      onSuccess: () => {
        toast.success(t("admin.announcements.createSuccess"))
        closeDialogs()
      },
    })
  })

  const submitEdit = form.handleSubmit((values) => {
    if (!editingPostId) return

    updateMutation.mutate(toAnnouncementMutationRequest(values), {
      onSuccess: () => {
        toast.success(t("admin.announcements.updateSuccess"))
        closeDialogs()
      },
    })
  })

  if (announcementsQuery.isError) {
    return <PageState title={t("admin.announcements.loadFailedTitle")} description={getErrorMessage(announcementsQuery.error)} />
  }

  return (
    <AdminPage
      actions={(
        <Button onClick={openCreateDialog} type="button">
          <Plus className="size-4" weight="bold" />
          {t("admin.announcements.create")}
        </Button>
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.announcements.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnnouncementTable
            announcements={announcementsQuery.data?.data ?? []}
            isLoading={announcementsQuery.isLoading}
            onDelete={setDeletingPost}
            onEdit={(post) => openEditDialog(post.post_id)}
          />
          {announcementsQuery.data ? (
            <AdminPagination
              onPageChange={setPage}
              page={announcementsQuery.data.page}
              total={announcementsQuery.data.total}
              totalPages={announcementsQuery.data.totalPages}
            />
          ) : null}
          {deleteMutation.error ? <MutationErrorAlert error={deleteMutation.error} /> : null}
        </CardContent>
      </Card>

      <AnnouncementDialog
        error={createMutation.error}
        form={form}
        isLoading={false}
        isOpen={createDialog.isOpen}
        isSubmitting={isMutating}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
        onSubmit={submitCreate}
        submitLabel={t("admin.announcements.dialog.createSubmit")}
        title={t("admin.announcements.dialog.createTitle")}
      />

      <AnnouncementDialog
        error={updateMutation.error}
        form={form}
        isLoading={editPostQuery.isLoading}
        isOpen={editDialog.isOpen}
        isSubmitting={isMutating}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
        onSubmit={submitEdit}
        submitLabel={t("admin.announcements.dialog.editSubmit")}
        title={t("admin.announcements.dialog.editTitle")}
      />

      <DeleteAnnouncementDialog
        announcement={deletingPost}
        isDeleting={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeletingPost(null)
        }}
        onConfirm={() => {
          if (!deletingPost) return

          deleteMutation.mutate(deletingPost.post_id, {
            onSuccess: () => {
              toast.success(t("admin.announcements.deleteSuccess"))
              setDeletingPost(null)
            },
          })
        }}
      />

      <EditPostLoader
        form={form}
        isOpen={editDialog.isOpen}
        post={editPostQuery.data}
      />
    </AdminPage>
  )
}

type AnnouncementTableProps = {
  announcements: PostListItem[]
  isLoading: boolean
  onDelete: (post: PostListItem) => void
  onEdit: (post: PostListItem) => void
}

function AnnouncementTable({ announcements, isLoading, onDelete, onEdit }: AnnouncementTableProps) {
  const { t } = useTranslation()
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>{t("admin.announcements.table.title")}</TableHead>
            <TableHead>{t("admin.announcements.table.author")}</TableHead>
            <TableHead>{t("admin.announcements.table.created")}</TableHead>
            <TableHead>{t("admin.announcements.table.updated")}</TableHead>
            <TableHead className="text-right">{t("admin.announcements.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <AnnouncementTableSkeleton />
          ) : announcements.length > 0 ? (
            announcements.map((announcement) => (
              <TableRow key={announcement.post_id}>
                <TableCell className="font-mono text-xs">{announcement.post_id}</TableCell>
                <TableCell>
                  <div className="min-w-72">
                    <div className="font-medium">{resolvePostListTitle(announcement, "zh")}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {announcement.title_zh ? <Badge variant="outline">{t("admin.announcements.language.zh")}</Badge> : null}
                      {announcement.title_en ? <Badge variant="outline">{t("admin.announcements.language.en")}</Badge> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{announcement.user_name ?? t("admin.announcements.table.unknownAuthor")}</TableCell>
                <TableCell>{formatDate(announcement.created_time)}</TableCell>
                <TableCell>{formatDate(announcement.updated_time)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/post/${announcement.post_id}`}>
                        <Eye className="size-3.5" weight="bold" />
                        {t("admin.announcements.actions.view")}
                      </Link>
                    </Button>
                    <Button onClick={() => onEdit(announcement)} size="sm" type="button" variant="outline">
                      <PencilSimple className="size-3.5" weight="bold" />
                      {t("admin.announcements.actions.edit")}
                    </Button>
                    <Button onClick={() => onDelete(announcement)} size="sm" type="button" variant="destructive">
                      <Trash className="size-3.5" weight="bold" />
                      {t("admin.announcements.actions.delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-10 text-center text-muted-foreground" colSpan={6}>
                {t("admin.announcements.table.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function AnnouncementTableSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-72" /></TableCell>
      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="ml-auto h-8 w-48" /></TableCell>
    </TableRow>
  ))
}

type AnnouncementDialogProps = {
  error: unknown
  form: UseFormReturn<AnnouncementFormValues>
  isLoading: boolean
  isOpen: boolean
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
  submitLabel: string
  title: string
}

function AnnouncementDialog({ error, form, isLoading, isOpen, isSubmitting, onOpenChange, onSubmit, submitLabel, title }: AnnouncementDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("admin.announcements.dialog.description")}</DialogDescription>
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
            <Tabs defaultValue="zh">
              <TabsList>
                <TabsTrigger value="zh">{t("admin.announcements.language.zh")}</TabsTrigger>
                <TabsTrigger value="en">{t("admin.announcements.language.en")}</TabsTrigger>
              </TabsList>
              <TabsContent className="mt-4" value="zh">
                <AnnouncementLanguageFields
                  contentError={form.formState.errors.content_zh?.message}
                  contentName="content_zh"
                  disabled={isSubmitting}
                  form={form}
                  placeholder={t("admin.announcements.language.zhTitlePlaceholder")}
                  titleError={form.formState.errors.title_zh?.message}
                  titleName="title_zh"
                />
              </TabsContent>
              <TabsContent className="mt-4" value="en">
                <AnnouncementLanguageFields
                  contentError={form.formState.errors.content_en?.message}
                  contentName="content_en"
                  disabled={isSubmitting}
                  form={form}
                  placeholder={t("admin.announcements.language.enTitlePlaceholder")}
                  titleError={form.formState.errors.title_en?.message}
                  titleName="title_en"
                />
              </TabsContent>
            </Tabs>
            {error ? <MutationErrorAlert error={error} /> : null}
            <DialogFooter>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting ? t("admin.announcements.dialog.saving") : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

type AnnouncementLanguageFieldsProps = {
  contentError?: string
  contentName: "content_en" | "content_zh"
  disabled: boolean
  form: UseFormReturn<AnnouncementFormValues>
  placeholder: string
  titleError?: string
  titleName: "title_en" | "title_zh"
}

function AnnouncementLanguageFields({ contentError, contentName, disabled, form, placeholder, titleError, titleName }: AnnouncementLanguageFieldsProps) {
  const { t } = useTranslation()
  const isZh = titleName === "title_zh"
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={titleName}>{isZh ? t("admin.announcements.language.zhTitle") : t("admin.announcements.language.enTitle")}</Label>
        <Input
          aria-invalid={Boolean(titleError)}
          className="mt-2"
          disabled={disabled}
          id={titleName}
          placeholder={placeholder}
          {...form.register(titleName)}
        />
        <FormFieldError message={titleError} />
      </div>
      <div>
        <Label htmlFor={contentName}>{isZh ? t("admin.announcements.language.zhContent") : t("admin.announcements.language.enContent")}</Label>
        <div className="mt-2">
          <Controller
            control={form.control}
            name={contentName}
            render={({ field }) => (
              <LazyRichTextEditor
                disabled={disabled}
                error={contentError}
                id={contentName}
                label={isZh ? t("admin.announcements.language.zhContent") : t("admin.announcements.language.enContent")}
                minHeightClassName="min-h-80"
                onBlur={field.onBlur}
                onChange={field.onChange}
                placeholder={isZh ? t("admin.announcements.language.zhContentPlaceholder") : t("admin.announcements.language.enContentPlaceholder")}
                value={field.value}
              />
            )}
          />
        </div>
        <FormFieldError message={contentError} />
      </div>
    </div>
  )
}

type DeleteAnnouncementDialogProps = {
  announcement: PostListItem | null
  isDeleting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

function DeleteAnnouncementDialog({ announcement, isDeleting, onConfirm, onOpenChange }: DeleteAnnouncementDialogProps) {
  const { t } = useTranslation()
  return (
    <AlertDialog open={Boolean(announcement)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.announcements.deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("admin.announcements.deleteDialog.description", { title: announcement ? resolvePostListTitle(announcement, "zh") : t("admin.announcements.deleteDialog.fallbackTitle") })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("user.edit.cancel")}</AlertDialogCancel>
          <AlertDialogAction disabled={isDeleting} onClick={onConfirm} variant="destructive">
            {isDeleting ? t("admin.announcements.actions.deleting") : t("admin.announcements.actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type EditPostLoaderProps = {
  form: UseFormReturn<AnnouncementFormValues>
  isOpen: boolean
  post: PostDetail | undefined
}

function EditPostLoader({ form, isOpen, post }: EditPostLoaderProps) {
  useEffect(() => {
    if (!isOpen || !post) return

    const zh = post.translations.find((translation) => translation.language === "zh")
    const en = post.translations.find((translation) => translation.language === "en")

    form.reset({
      content_en: en?.content ?? "",
      content_zh: zh?.content ?? "",
      title_en: en?.title ?? "",
      title_zh: zh?.title ?? "",
    })
  }, [form, isOpen, post])

  return null
}

function toAnnouncementMutationRequest(values: AnnouncementFormValues): PostMutationRequest {
  return {
    end: null,
    limit: null,
    translations: [
      {
        content: values.content_zh.trim(),
        language: "zh",
        title: values.title_zh.trim(),
      },
      {
        content: values.content_en.trim(),
        language: "en",
        title: values.title_en.trim(),
      },
    ],
    type: 3,
  }
}

function useDisclosure() {
  const [isOpen, setIsOpen] = useBooleanState(false)

  return {
    close: () => setIsOpen(false),
    isOpen,
    open: () => setIsOpen(true),
  }
}

function useBooleanState(initialValue: boolean) {
  return useState(initialValue)
}

function useStringState(initialValue: string | null) {
  return useState<string | null>(initialValue)
}

function usePostState(initialValue: PostListItem | null) {
  return useState<PostListItem | null>(initialValue)
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
}

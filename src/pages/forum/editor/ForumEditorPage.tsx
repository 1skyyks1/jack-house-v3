import { zodResolver } from "@hookform/resolvers/zod"
import { FloppyDisk, X } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getEditablePostTypesForRole,
  useCreatePostMutation,
  usePostDetailQuery,
  useUpdatePostMutation,
  type EditablePostType,
} from "@/entities/post"
import { useCurrentUserQuery } from "@/features/auth"
import { RichTextEditor } from "@/features/rich-text/editor"
import { RichTextRenderer } from "@/features/rich-text/renderer"
import { cn } from "@/lib/utils"
import { AppAlert, FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import type { AppLocale } from "@/shared/i18n/client"
import {
  canEditPost,
  clearPostEditorDraft,
  createPostEditorSchema,
  defaultValues,
  editablePostTypes,
  formValuesFromPost,
  getPostTypeMeta,
  isEditableEditorPostType,
  isEmptyPostEditorDraft,
  normalizePostEditorDraftValues,
  readPostEditorDraft,
  toPostMutationRequest,
  writePostEditorDraft,
  type PostEditorFormValues,
} from "./model"

export function ForumEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const currentUserQuery = useCurrentUserQuery()
  const postQuery = usePostDetailQuery(id)
  const createMutation = useCreatePostMutation()
  const updateMutation = useUpdatePostMutation(id ?? "")
  const allowedTypes = getEditablePostTypesForRole(currentUserQuery.data?.role)
  const form = useForm<PostEditorFormValues>({
    resolver: zodResolver(createPostEditorSchema(t)),
    defaultValues: isEditing ? defaultValues : readPostEditorDraft()?.values ?? defaultValues,
  })
  const selectedType = useWatch({ control: form.control, name: "type" })
  const draftValues = useWatch({ control: form.control })
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!postQuery.data || !isEditing) return

    form.reset(formValuesFromPost(postQuery.data))
  }, [form, isEditing, postQuery.data])

  useEffect(() => {
    if (selectedType !== 1) {
      form.setValue("end", null, { shouldDirty: true, shouldValidate: false })
    }
  }, [form, selectedType])

  useEffect(() => {
    if (isEditing || isSubmitting) return

    const timeoutId = window.setTimeout(() => {
      const values = normalizePostEditorDraftValues(draftValues)

      if (isEmptyPostEditorDraft(values)) {
        clearPostEditorDraft()
        return
      }

      writePostEditorDraft(values)
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [draftValues, isEditing, isSubmitting])

  if (isEditing && postQuery.isLoading) {
    return <ForumEditorSkeleton />
  }

  if (isEditing && postQuery.isError) {
    return (
      <PageState
        title={t("forum.editor.loadFailedTitle")}
        description={getErrorMessage(postQuery.error)}
        action={<BackLink to="/forum">{t("forum.editor.backToForum")}</BackLink>}
      />
    )
  }

  if (currentUserQuery.isError) {
    return (
      <PageState
        title={t("forum.editor.accountCheckFailedTitle")}
        description={getErrorMessage(currentUserQuery.error)}
        action={<BackLink to="/forum">{t("forum.editor.backToForum")}</BackLink>}
      />
    )
  }

  if (isEditing && postQuery.data && !isEditableEditorPostType(postQuery.data.type)) {
    return (
      <PageState
        title={t("forum.editor.unsupportedTitle")}
        description={t("forum.editor.unsupportedDescription")}
        action={<BackLink to={`/post/${id}`}>{t("forum.editor.backToPost")}</BackLink>}
      />
    )
  }

  const canEditExistingPost = !isEditing || canEditPost(postQuery.data, currentUserQuery.data?.user_id, currentUserQuery.data?.role)
  const canUseCurrentType = !isEditing || allowedTypes.includes(form.getValues("type"))

  const submit = form.handleSubmit((values) => {
    if (!canEditExistingPost) {
      toast.error(t("forum.editor.editOwnOnly"))
      return
    }

    if (!canUseCurrentType) {
      toast.error(t("forum.editor.roleNotAllowed"))
      return
    }

    const request = toPostMutationRequest(values)

    if (isEditing && id) {
      updateMutation.mutate(request, {
        onSuccess: () => {
          toast.success(t("forum.editor.updated"))
          navigate(`/post/${id}`)
        },
      })
      return
    }

    createMutation.mutate(request, {
      onSuccess: (createdPost) => {
        clearPostEditorDraft()
        toast.success(t("forum.editor.created"))
        navigate(`/post/${createdPost.post_id}`)
      },
    })
  })

  const cancelTo = isEditing && id ? `/post/${id}` : "/forum"
  const editorPageLabel = isEditing ? t("forum.editor.editPost") : t("forum.editor.createPost")

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={isEditing && id ? `/post/${id}` : "/forum"}>{isEditing ? t("forum.editor.postLabel") : t("common.forum")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{editorPageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" onSubmit={submit}>
        <div className="min-w-0 space-y-6 rounded-lg border bg-card p-5">
          <PostTypePicker
            allowedTypes={allowedTypes}
            disabled={isEditing || isSubmitting || currentUserQuery.isLoading}
            selectedType={selectedType}
            onSelectType={(type) => form.setValue("type", type, { shouldDirty: true, shouldValidate: true })}
          />
          <FormFieldError message={form.formState.errors.type?.message} />

          {selectedType === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="requestDeadline">{t("forum.editor.requestDeadline")}</Label>
                <Input
                  className="mt-2"
                  disabled={isSubmitting}
                  id="requestDeadline"
                  type="datetime-local"
                  aria-invalid={Boolean(form.formState.errors.end)}
                  {...form.register("end")}
                />
                <FormFieldError message={form.formState.errors.end?.message} />
              </div>
              <div>
                <Label htmlFor="submissionLimit">{t("forum.editor.submissionLimit")}</Label>
                <Input
                  className="mt-2"
                  disabled={isSubmitting}
                  id="submissionLimit"
                  min={1}
                  type="number"
                  aria-invalid={Boolean(form.formState.errors.limit)}
                  {...form.register("limit", { valueAsNumber: true })}
                />
                <FormFieldError message={form.formState.errors.limit?.message} />
              </div>
            </div>
          ) : null}

          <LanguageEditorSection
            contentError={form.formState.errors.content_zh?.message}
            contentName="content_zh"
            disabled={isSubmitting}
            form={form}
            locale="zh"
            titleError={form.formState.errors.title_zh?.message}
            titleName="title_zh"
          />

          <LanguageEditorSection
            contentError={form.formState.errors.content_en?.message}
            contentName="content_en"
            disabled={isSubmitting}
            form={form}
            locale="en"
            titleError={form.formState.errors.title_en?.message}
            titleName="title_en"
          />
        </div>

        <aside className="space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <h2 className="font-heading text-xl font-semibold">{t("forum.editor.publishTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {isEditing ? t("forum.editor.publishDescriptionEdit") : t("forum.editor.publishDescriptionCreate")}
              </p>
              {!canEditExistingPost ? (
                <AppAlert className="mt-4" tone="destructive">
                  {t("forum.editor.editOwnOnlyAlert")}
                </AppAlert>
              ) : null}
              <div className="mt-4 grid gap-2">
                <Button
                  className="w-full"
                  disabled={isSubmitting || currentUserQuery.isLoading || !canEditExistingPost}
                  type="submit"
                >
                  <FloppyDisk className="size-4" weight="bold" />
                  {isSubmitting ? t("forum.editor.saving") : isEditing ? t("forum.editor.updatePost") : t("forum.editor.createPostCta")}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={cancelTo}>
                    <X className="size-4" weight="bold" />
                    {t("forum.editor.cancel")}
                  </Link>
                </Button>
                {!isEditing ? (
                  <Button
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={() => {
                      clearPostEditorDraft()
                      form.reset(defaultValues)
                      toast.success(t("forum.editor.localDraftCleared"))
                    }}
                    type="button"
                    variant="outline"
                  >
                    {t("forum.editor.clearLocalDraft")}
                  </Button>
                ) : null}
              </div>
              {createMutation.error ? <MutationErrorAlert className="mt-4" error={createMutation.error} /> : null}
              {updateMutation.error ? <MutationErrorAlert className="mt-4" error={updateMutation.error} /> : null}
            </div>

            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              <h2 className="font-heading text-lg font-semibold text-foreground">{t("forum.editor.notesTitle")}</h2>
              <p className="mt-2">
                {t("forum.editor.notesBody")}
              </p>
              {!isEditing ? <p className="mt-2">{t("forum.editor.notesDraft")}</p> : null}
            </div>
          </div>
        </aside>
      </form>
    </section>
  )
}

type PostTypePickerProps = {
  allowedTypes: EditablePostType[]
  disabled: boolean
  onSelectType: (type: EditablePostType) => void
  selectedType: EditablePostType
}

function PostTypePicker({ allowedTypes, disabled, onSelectType, selectedType }: PostTypePickerProps) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-xl font-semibold">{t("forum.editor.postTypeTitle")}</h2>
        {disabled ? <span className="text-xs font-medium text-muted-foreground">{t("forum.editor.locked")}</span> : null}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {editablePostTypes.map((type) => {
          const isAllowed = allowedTypes.includes(type)
          return (
            <Button
              aria-pressed={selectedType === type}
              className={cn(
                "h-auto min-h-28 w-full flex-col items-start justify-start whitespace-normal rounded-lg p-4 text-left",
                selectedType === type && "border-primary bg-primary/5 text-foreground shadow-sm hover:bg-primary/5",
              )}
              disabled={disabled || !isAllowed}
              key={type}
              onClick={() => onSelectType(type)}
              type="button"
              variant="outline"
            >
              <span className="font-medium">{getPostTypeMeta(type, t).label}</span>
              <span className="mt-2 block text-sm text-muted-foreground">{getPostTypeMeta(type, t).description}</span>
              {!isAllowed ? <span className="mt-3 block text-xs font-medium text-destructive">{t("forum.editor.notAllowedForRole")}</span> : null}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

type LanguageEditorSectionProps = {
  contentError?: string
  contentName: "content_en" | "content_zh"
  disabled: boolean
  form: UseFormReturn<PostEditorFormValues>
  locale: AppLocale
  titleError?: string
  titleName: "title_en" | "title_zh"
}

function LanguageEditorSection({
  contentError,
  contentName,
  disabled,
  form,
  locale,
  titleError,
  titleName,
}: LanguageEditorSectionProps) {
  const { t } = useTranslation()
  const isZh = locale === "zh"
  const label = isZh ? t("forum.editor.language.zh") : t("forum.editor.language.en")
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const contentValue = useWatch({ control: form.control, name: contentName })
  const titleValue = useWatch({ control: form.control, name: titleName })

  return (
    <section className="space-y-4 border-t pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">{label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isZh ? t("forum.editor.language.zhDescription") : t("forum.editor.language.enDescription")}
          </p>
        </div>
        <Tabs className="w-full sm:w-auto" value={mode} onValueChange={(value) => setMode(value as "edit" | "preview")}>
          <TabsList className="grid w-full grid-cols-2 sm:w-44">
            <TabsTrigger value="edit">{t("forum.editor.language.edit")}</TabsTrigger>
            <TabsTrigger value="preview">{t("forum.editor.language.preview")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === "edit" ? (
        <>
          <div>
            <Label htmlFor={titleName}>{isZh ? t("forum.editor.language.zhTitle") : t("forum.editor.language.enTitle")}</Label>
            <Input
              className="mt-2"
              disabled={disabled}
              id={titleName}
              placeholder={isZh ? t("forum.editor.language.zhTitlePlaceholder") : t("forum.editor.language.enTitlePlaceholder")}
              aria-invalid={Boolean(titleError)}
              {...form.register(titleName)}
            />
            <FormFieldError message={titleError} />
          </div>

          <div>
            <Label htmlFor={contentName}>{isZh ? t("forum.editor.language.zhContent") : t("forum.editor.language.enContent")}</Label>
            <div className="mt-2">
              <Controller
                control={form.control}
                name={contentName}
                render={({ field }) => (
                  <RichTextEditor
                    disabled={disabled}
                    error={contentError}
                    id={contentName}
                    label={isZh ? t("forum.editor.language.zhContent") : t("forum.editor.language.enContent")}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    placeholder={isZh ? t("forum.editor.language.zhContentPlaceholder") : t("forum.editor.language.enContentPlaceholder")}
                    value={field.value}
                  />
                )}
              />
            </div>
            <FormFieldError message={contentError} />
          </div>
        </>
      ) : (
        <LanguagePreview
          content={contentValue}
          emptyLabel={isZh ? t("forum.editor.language.zhEmptyPreview") : t("forum.editor.language.enEmptyPreview")}
          title={titleValue}
          titlePlaceholder={isZh ? t("forum.editor.language.zhUntitled") : t("forum.editor.language.enUntitled")}
        />
      )}
    </section>
  )
}

type LanguagePreviewProps = {
  content: string
  emptyLabel: string
  title: string
  titlePlaceholder: string
}

function LanguagePreview({ content, emptyLabel, title, titlePlaceholder }: LanguagePreviewProps) {
  const { t } = useTranslation()
  return (
    <article className="rounded-lg border bg-background p-5">
      <div className="border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("forum.editor.previewLabel")}</p>
        <h3 className="mt-2 break-words font-heading text-2xl font-semibold">{title.trim() || titlePlaceholder}</h3>
      </div>
      <RichTextRenderer className="mt-5" content={content} emptyLabel={emptyLabel} />
    </article>
  )
}

function ForumEditorSkeleton() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6 rounded-lg border bg-card p-5">
          <div className="h-8 w-52 animate-pulse rounded bg-muted" />
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="h-28 animate-pulse rounded-lg bg-muted" key={index} />
            ))}
          </div>
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="hidden h-48 animate-pulse rounded-lg bg-muted lg:block" />
      </div>
    </section>
  )
}

type BackLinkProps = {
  children: ReactNode
  to: string
}

function BackLink({ children, to }: BackLinkProps) {
  return (
    <Button asChild>
      <Link to={to}>{children}</Link>
    </Button>
  )
}

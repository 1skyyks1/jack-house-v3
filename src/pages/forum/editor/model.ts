import type { TFunction } from "i18next"
import { z } from "zod"
import type { EditablePostType, PostDetail, PostMutationRequest } from "@/entities/post"

const postEditorDraftKey = "jack-house-v3:forum-editor:draft:new"
const postEditorDraftVersion = 1

export const editablePostTypes: EditablePostType[] = [0, 1, 2]

export const createPostEditorSchema = (t: TFunction) => z.object({
  content_en: z.string().trim(),
  content_zh: z.string().trim(),
  end: z.string().nullable(),
  limit: z.number().int().min(1, t("forum.editor.validation.limitMin")).max(999, t("forum.editor.validation.limitMax")),
  title_en: z.string().trim().max(255, t("forum.editor.validation.titleEnMax")),
  title_zh: z.string().trim().max(255, t("forum.editor.validation.titleZhMax")),
  type: z.union([z.literal(0), z.literal(1), z.literal(2)]),
}).superRefine((values, context) => {
  const hasZh = Boolean(values.title_zh.trim() && stripHtml(values.content_zh).trim())
  const hasEn = Boolean(values.title_en.trim() && stripHtml(values.content_en).trim())

  if (!hasZh && !hasEn) {
    context.addIssue({
      code: "custom",
      message: t("forum.editor.validation.needOneLanguage"),
      path: ["title_zh"],
    })
  }

  if (values.title_zh.trim() && !stripHtml(values.content_zh).trim()) {
    context.addIssue({
      code: "custom",
      message: t("forum.editor.validation.zhContentRequired"),
      path: ["content_zh"],
    })
  }

  if (stripHtml(values.content_zh).trim() && !values.title_zh.trim()) {
    context.addIssue({
      code: "custom",
      message: t("forum.editor.validation.zhTitleRequired"),
      path: ["title_zh"],
    })
  }

  if (values.title_en.trim() && !stripHtml(values.content_en).trim()) {
    context.addIssue({
      code: "custom",
      message: t("forum.editor.validation.enContentRequired"),
      path: ["content_en"],
    })
  }

  if (stripHtml(values.content_en).trim() && !values.title_en.trim()) {
    context.addIssue({
      code: "custom",
      message: t("forum.editor.validation.enTitleRequired"),
      path: ["title_en"],
    })
  }

  if (values.type === 1) {
    if (!values.end) {
      context.addIssue({
        code: "custom",
        message: t("forum.editor.validation.deadlineRequired"),
        path: ["end"],
      })
      return
    }

    const endDate = new Date(values.end)
    if (Number.isNaN(endDate.getTime()) || endDate.getTime() <= Date.now()) {
      context.addIssue({
        code: "custom",
        message: t("forum.editor.validation.deadlineFuture"),
        path: ["end"],
      })
    }
  }
})

export type PostEditorFormValues = z.infer<ReturnType<typeof createPostEditorSchema>>

export const defaultValues: PostEditorFormValues = {
  content_en: "",
  content_zh: "",
  end: null,
  limit: 2,
  title_en: "",
  title_zh: "",
  type: 0,
}

type PostEditorDraft = {
  savedAt: string
  values: PostEditorFormValues
  version: typeof postEditorDraftVersion
}

export function formValuesFromPost(post: PostDetail): PostEditorFormValues {
  const zh = post.translations.find((translation) => translation.language === "zh")
  const en = post.translations.find((translation) => translation.language === "en")
  const editableType = isEditableEditorPostType(post.type) ? post.type : 0

  return {
    content_en: en?.content ?? "",
    content_zh: zh?.content ?? "",
    end: post.end ? toDatetimeLocalValue(post.end) : null,
    limit: post.limit ?? 2,
    title_en: en?.title ?? "",
    title_zh: zh?.title ?? "",
    type: editableType,
  }
}

export function toPostMutationRequest(values: PostEditorFormValues): PostMutationRequest {
  return {
    end: values.type === 1 && values.end ? new Date(values.end).toISOString() : null,
    limit: values.type === 1 ? values.limit : null,
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
    type: values.type,
  }
}

export function canEditPost(post: PostDetail | undefined, currentUserId: number | undefined, role: number | undefined) {
  if (!post || currentUserId === undefined) return true

  return role === 2 || post.user_id === currentUserId
}

export function isEditableEditorPostType(type: number): type is EditablePostType {
  return type === 0 || type === 1 || type === 2
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function getPostTypeMeta(type: EditablePostType, t: TFunction) {
  switch (type) {
    case 0:
      return { label: t("forum.editor.normalLabel"), description: t("forum.editor.normalDescription") }
    case 1:
      return { label: t("forum.editor.requestLabel"), description: t("forum.editor.requestDescription") }
    case 2:
      return { label: t("forum.editor.eventLabel"), description: t("forum.editor.eventDescription") }
  }
}

export function readPostEditorDraft(): PostEditorDraft | null {
  try {
    const raw = window.localStorage.getItem(postEditorDraftKey)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PostEditorDraft>
    if (parsed.version !== postEditorDraftVersion || !parsed.values) return null

    return {
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : new Date().toISOString(),
      values: normalizePostEditorDraftValues(parsed.values),
      version: postEditorDraftVersion,
    }
  } catch {
    return null
  }
}

export function writePostEditorDraft(values: PostEditorFormValues) {
  const draft: PostEditorDraft = {
    savedAt: new Date().toISOString(),
    values,
    version: postEditorDraftVersion,
  }

  window.localStorage.setItem(postEditorDraftKey, JSON.stringify(draft))
}

export function clearPostEditorDraft() {
  window.localStorage.removeItem(postEditorDraftKey)
}

export function normalizePostEditorDraftValues(values: Partial<PostEditorFormValues> | undefined): PostEditorFormValues {
  const type = values?.type
  const editableType = type === 0 || type === 1 || type === 2 ? type : defaultValues.type

  return {
    content_en: typeof values?.content_en === "string" ? values.content_en : "",
    content_zh: typeof values?.content_zh === "string" ? values.content_zh : "",
    end: typeof values?.end === "string" ? values.end : null,
    limit: typeof values?.limit === "number" && Number.isFinite(values.limit) ? values.limit : defaultValues.limit,
    title_en: typeof values?.title_en === "string" ? values.title_en : "",
    title_zh: typeof values?.title_zh === "string" ? values.title_zh : "",
    type: editableType,
  }
}

export function isEmptyPostEditorDraft(values: PostEditorFormValues) {
  return (
    !values.title_zh.trim() &&
    !stripHtml(values.content_zh).trim() &&
    !values.title_en.trim() &&
    !stripHtml(values.content_en).trim() &&
    values.type === defaultValues.type &&
    values.limit === defaultValues.limit &&
    !values.end
  )
}

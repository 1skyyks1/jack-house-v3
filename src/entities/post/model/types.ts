import type { AppLocale } from "@/shared/i18n/client"
import { i18n } from "@/shared/i18n/client"

export type PostType = 0 | 1 | 2 | 3
export type PostTypeFilter = PostType | -1
export type EditablePostType = 0 | 1 | 2

export type PostTranslation = {
  title: string | null
  content: string | null
  language: AppLocale
}

export type PostAuthor = {
  user_name: string
  role: number
  avatar: string | null
}

export type PostDetail = {
  post_id: number
  user_id: number
  type: PostType
  created_time: string
  updated_time: string
  end: string | null
  limit: number | null
  folder_id: number | null
  translations: PostTranslation[]
  user: PostAuthor
}

export type PostListItem = {
  post_id: number
  user_id: number
  type: PostType
  created_time: string
  updated_time: string
  end: string | null
  limit: number | null
  folder_id: number | null
  title_zh: string | null
  title_en: string | null
  user_name?: string
  role?: number
}

export type PostSearchResult = {
  post_id: number
  value: string | null
  time: string | null
}

export type ForumPreviewGroup = {
  type: PostType
  posts: PostListItem[]
}

export type LocalizedPostContent = {
  title: string
  content: string
  locale: AppLocale
}

export function resolvePostContent(post: PostDetail, locale: AppLocale): LocalizedPostContent {
  const primary = post.translations.find((translation) => translation.language === locale)
  const fallbackLocale = locale === "zh" ? "en" : "zh"
  const fallback = post.translations.find((translation) => translation.language === fallbackLocale)
  const resolved = primary?.title || primary?.content ? primary : fallback

  return {
    title: resolved?.title || fallback?.title || i18n.t("common.untitled"),
    content: resolved?.content || fallback?.content || "",
    locale: resolved?.language ?? fallback?.language ?? locale,
  }
}

export function resolvePostListTitle(post: PostListItem, locale: AppLocale) {
  if (locale === "zh") {
    return post.title_zh || post.title_en || i18n.t("common.noTitle")
  }

  return post.title_en || post.title_zh || i18n.t("common.noTitle")
}

export function isPostSubmissionActive(endDate?: string | null) {
  if (!endDate) return true

  const end = new Date(endDate)
  if (Number.isNaN(end.getTime())) return false

  return new Date() < end
}

export function getEditablePostTypesForRole(role: number | null | undefined): EditablePostType[] {
  switch (role) {
    case 0:
      return [0]
    case 1:
    case 2:
      return [0, 1, 2]
    default:
      return []
  }
}

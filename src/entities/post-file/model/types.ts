import { i18n } from "@/shared/i18n/client"

export type PostFileStatus = 0 | 1 | 2

export type PostFile = {
  feedback: string | null
  file_id: number
  file_name: string
  file_url: string
  note: string | null
  post_id: number
  size: number
  status: PostFileStatus
  uploaded_time: string
  user_id: number
  user_name?: string
  is_locked: boolean
  locked_at: string
}

export type PublicPostFileListItem = Pick<PostFile, "feedback" | "file_id" | "file_name" | "post_id" | "size" | "status" | "uploaded_time" | "user_id">

export const POST_FILE_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000

export function getPostFileLockedAt(file: Pick<PostFile, "locked_at" | "uploaded_time">) {
  const apiLockedAt = new Date(file.locked_at)
  if (!Number.isNaN(apiLockedAt.getTime())) return apiLockedAt

  const uploadedAt = new Date(file.uploaded_time)
  if (Number.isNaN(uploadedAt.getTime())) return null
  return new Date(uploadedAt.getTime() + POST_FILE_DELETE_WINDOW_MS)
}

export function getPostFileLockRemainingMs(file: Pick<PostFile, "locked_at" | "uploaded_time">, now = Date.now()) {
  const lockedAt = getPostFileLockedAt(file)
  return lockedAt ? Math.max(0, lockedAt.getTime() - now) : 0
}

export function isPostFileLocked(file: Pick<PostFile, "is_locked" | "locked_at" | "uploaded_time">, now = Date.now()) {
  if (file.is_locked === true) return true
  return getPostFileLockRemainingMs(file, now) === 0
}

export function formatPostFileLockCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")
}

export function getPostFileStatusLabel(status: PostFileStatus) {
  switch (status) {
    case 0:
      return i18n.t("post.submission.status.pending")
    case 1:
      return i18n.t("post.submission.status.approved")
    case 2:
      return i18n.t("post.submission.status.rejected")
  }
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`
}

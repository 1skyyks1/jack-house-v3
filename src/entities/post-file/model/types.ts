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
}

export type PublicPostFileListItem = Pick<PostFile, "file_id" | "file_name" | "post_id" | "size" | "status" | "uploaded_time" | "user_id">

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

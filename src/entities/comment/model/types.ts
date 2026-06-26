import type { UserRole } from "@/entities/user"

export type PostComment = {
  avatar: string | null
  comment: string
  comment_id: number
  created_time: string
  post_id: number
  role: UserRole
  user_id: number
  user_name: string
}

export type PackComment = {
  avatar: string | null
  comment_id: number
  content: string
  created_time: string
  pack_id: number
  role?: UserRole
  updated_time: string
  user_id: number
  user_name: string
}

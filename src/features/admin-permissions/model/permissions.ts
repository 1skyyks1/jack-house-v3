import { i18n } from "@/shared/i18n/client"

export type AdminPermissionKey =
  | "admin"
  | "aiImages"
  | "announcement"
  | "badges"
  | "dashboard"
  | "eventStages"
  | "events"
  | "postFiles"
  | "packFeedback"
  | "posts"
  | "tournaments"
  | "users"

export const ADMIN_PERMISSION_LABELS: Record<AdminPermissionKey, string> = {
  admin: "admin.nav.admin",
  aiImages: "admin.nav.aiImages",
  announcement: "admin.nav.announcement",
  badges: "admin.nav.badges",
  dashboard: "admin.nav.dashboard",
  eventStages: "admin.nav.eventStages",
  events: "admin.nav.events",
  postFiles: "admin.nav.postFiles",
  packFeedback: "admin.nav.packFeedback",
  posts: "admin.nav.posts",
  tournaments: "admin.nav.tournaments",
  users: "admin.nav.users",
}

export function getAdminPermissionLabel(key: AdminPermissionKey) {
  return i18n.t(ADMIN_PERMISSION_LABELS[key])
}

export function hasAdminPermission(permissions: string[] | undefined, key: AdminPermissionKey) {
  if (!permissions) return false
  if (key === "tournaments") return permissions.includes("*") || permissions.includes("admin")
  return permissions.includes("*") || permissions.includes(key)
}

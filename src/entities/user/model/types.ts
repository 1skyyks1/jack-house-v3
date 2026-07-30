import { i18n } from "@/shared/i18n/client"
import type {
  Tournament,
  TournamentPerformanceStage,
  TournamentPlayerRating,
  TournamentRatingSnapshot,
} from "@/entities/tournament/model/types"

export type UserRole = 0 | 1 | 2
export type UserStatus = 0 | 1 | 2

export type UserBadge = {
  id: number
  name: string
  redirect_url: string | null
  signedUrl?: string
  url?: string
}

export type UserProfile = {
  user_id: number
  user_name: string
  email?: string | null
  avatar: string | null
  role: UserRole
  status: UserStatus
  osu_uid: number | null
  qq: string | null
  discord: string | null
  created_time: string
  updated_time: string
  badges?: UserBadge[]
}

export type UserTournamentExperience = {
  rating: TournamentPlayerRating
  snapshot: TournamentRatingSnapshot
  stages: TournamentPerformanceStage[]
  tournament: Pick<Tournament, "acronym" | "banner" | "created_time" | "id" | "name" | "qual_end" | "qual_start" | "status">
}

export function getUserRoleLabel(role: UserRole) {
  switch (role) {
    case 0:
      return i18n.t("user.role.user")
    case 1:
      return i18n.t("user.role.organizer")
    case 2:
      return i18n.t("user.role.admin")
  }
}

export function getUserStatusLabel(status: UserStatus) {
  switch (status) {
    case 0:
      return i18n.t("user.status.active")
    case 1:
      return i18n.t("user.status.restricted")
    case 2:
      return i18n.t("user.status.banned")
  }
}

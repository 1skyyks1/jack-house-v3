import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { useTournamentDetailQuery } from "@/entities/tournament"
import { PageState } from "@/shared/components"
import { useCurrentUserQuery, usePermissionsQuery } from "@/features/auth"
import { hasAdminPermission } from "./model/permissions"

type RequireTournamentAdminProps = {
  children: ReactNode
}

export function RequireTournamentAdmin({ children }: RequireTournamentAdminProps) {
  const { t } = useTranslation()
  const { tid } = useParams()
  const currentUserQuery = useCurrentUserQuery()
  const permissionsQuery = usePermissionsQuery()
  const tournamentQuery = useTournamentDetailQuery(tid)

  if (currentUserQuery.isLoading || permissionsQuery.isLoading || tournamentQuery.isLoading) {
    return <PageState title={t("admin.permissions.checkingTitle")} description={t("admin.permissions.checkingDescription")} />
  }

  if (currentUserQuery.isError || permissionsQuery.isError || tournamentQuery.isError) {
    const error = currentUserQuery.error ?? permissionsQuery.error ?? tournamentQuery.error
    const message = error instanceof Error ? error.message : t("admin.permissions.failedDescription")
    return <PageState title={t("admin.permissions.failedTitle")} description={message} />
  }

  const isGlobalAdmin = hasAdminPermission(permissionsQuery.data?.adminPermissions, "tournaments")
  const currentUserId = currentUserQuery.data?.user_id
  const isTournamentStaff = Boolean(
    currentUserId && tournamentQuery.data?.staff?.some((staff) => Number(staff.user_id) === Number(currentUserId)),
  )

  if (!isGlobalAdmin && !isTournamentStaff) {
    return <PageState title={t("admin.permissions.deniedTitle")} description={t("admin.permissions.deniedDescription")} />
  }

  return children
}

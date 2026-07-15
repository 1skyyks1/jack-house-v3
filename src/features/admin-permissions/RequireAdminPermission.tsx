import type { ReactNode } from "react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation } from "react-router-dom"
import { PageSkeleton, PageState } from "@/shared/components"
import { useAuthStore, usePermissionsQuery } from "@/features/auth"
import { hasAdminPermission, type AdminPermissionKey } from "./model/permissions"

type RequireAdminPermissionProps = {
  children: ReactNode
  permission: AdminPermissionKey
}

export function RequireAdminPermission({ children, permission }: RequireAdminPermissionProps) {
  const { t } = useTranslation()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const location = useLocation()
  const permissionsQuery = usePermissionsQuery()
  const redirectTo = `${location.pathname}${location.search}`

  useEffect(() => {
    if (!isLogged) {
      openLoginDialog(redirectTo)
    }
  }, [isLogged, openLoginDialog, redirectTo])

  if (!isLogged) {
    return <Navigate replace to="/" />
  }

  if (permissionsQuery.isLoading) {
    return <PageSkeleton />
  }

  if (permissionsQuery.isError) {
    const message = permissionsQuery.error instanceof Error ? permissionsQuery.error.message : t("admin.permissions.failedDescription")
    return <PageState title={t("admin.permissions.failedTitle")} description={message} />
  }

  if (!hasAdminPermission(permissionsQuery.data?.adminPermissions, permission)) {
    return <PageState title={t("admin.permissions.deniedTitle")} description={t("admin.permissions.deniedDescription")} />
  }

  return children
}

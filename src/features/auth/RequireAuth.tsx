import type { ReactNode } from "react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { PageSkeleton, PageState } from "@/shared/components"
import { useCurrentUserQuery } from "./api/authQueries"
import { useAuthStore } from "./model/authStore"

type RequireAuthProps = {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { t } = useTranslation()
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const location = useLocation()
  const currentUserQuery = useCurrentUserQuery()
  const redirectTo = `${location.pathname}${location.search}${location.hash}`
  const isAuthPending = !isLogged && !currentUserQuery.isError

  useEffect(() => {
    if (!isAuthPending && !isLogged) {
      openLoginDialog(redirectTo)
      toast.warning(t("common.loginRequired"), { id: `login-required:${redirectTo}` })
    }
  }, [isAuthPending, isLogged, openLoginDialog, redirectTo, t])

  if (isAuthPending) {
    return <PageSkeleton />
  }

  if (!isLogged) {
    return (
      <PageState
        action={<Button onClick={() => openLoginDialog(redirectTo)}>{t("common.login")}</Button>}
        description={t("common.loginRequiredDescription")}
        title={t("common.loginRequiredTitle")}
      />
    )
  }

  return children
}

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { authQueryKeys, useAuthStore } from "@/features/auth"
import { getCurrentUser } from "@/features/auth/api/authApi"
import { PageState } from "@/shared/components"

export function OAuthCompletePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loginRedirect = useAuthStore((state) => state.loginRedirect)
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  useEffect(() => {
    let ignore = false
    const redirectTo = loginRedirect ?? window.localStorage.getItem("loginRedirect") ?? "/"

    const completeLogin = async () => {
      if (!searchParams.get("userId")) {
        toast.error(t("auth.oauthFailed"))
        navigate("/", { replace: true })
        return
      }

      try {
        const currentUser = await queryClient.fetchQuery({
          queryFn: getCurrentUser,
          queryKey: authQueryKeys.currentUser,
          retry: false,
        })
        if (ignore) return
        setSession({ userId: currentUser.user_id })
        toast.success(t("auth.loginSuccess"))
        navigate(redirectTo, { replace: true })
      } catch {
        if (ignore) return
        toast.error(t("auth.sessionVerificationFailed"))
        navigate("/", { replace: true })
      }
    }

    void completeLogin()

    return () => {
      ignore = true
    }
  }, [loginRedirect, navigate, queryClient, searchParams, setSession, t])

  return <PageState title={t("auth.completingLogin")} description={t("auth.syncingSession")} />
}

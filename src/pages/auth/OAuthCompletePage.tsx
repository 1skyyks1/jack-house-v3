import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { useAuthStore } from "@/features/auth"
import { PageState } from "@/shared/components"

export function OAuthCompletePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loginRedirect = useAuthStore((state) => state.loginRedirect)
  const setSession = useAuthStore((state) => state.setSession)

  useEffect(() => {
    const userId = searchParams.get("userId")
    const redirectTo = loginRedirect ?? window.localStorage.getItem("loginRedirect") ?? "/"

    if (userId) {
      setSession({ userId })
      toast.success(t("auth.loginSuccess"))
      navigate(redirectTo, { replace: true })
      return
    }

    toast.error(t("auth.oauthFailed"))
    navigate("/", { replace: true })
  }, [loginRedirect, navigate, searchParams, setSession, t])

  return <PageState title={t("auth.completingLogin")} description={t("auth.syncingSession")} />
}

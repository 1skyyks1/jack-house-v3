import type { ReactNode } from "react"
import { useEffect } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "./model/authStore"

type RequireAuthProps = {
  children: ReactNode
  fallbackPath?: string
}

export function RequireAuth({ children, fallbackPath = "/" }: RequireAuthProps) {
  const isLogged = useAuthStore((state) => state.isLogged)
  const openLoginDialog = useAuthStore((state) => state.openLoginDialog)
  const location = useLocation()
  const redirectTo = `${location.pathname}${location.search}`

  useEffect(() => {
    if (!isLogged) {
      openLoginDialog(redirectTo)
    }
  }, [isLogged, openLoginDialog, redirectTo])

  if (!isLogged) {
    return <Navigate replace to={fallbackPath} />
  }

  return children
}

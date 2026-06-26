import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "../model/authStore"
import { getCurrentUser, getPermissions } from "./authApi"

export const authQueryKeys = {
  currentUser: ["auth", "current-user"] as const,
  permissions: ["auth", "permissions"] as const,
}

export function useCurrentUserQuery() {
  const isLogged = useAuthStore((state) => state.isLogged)

  return useQuery({
    enabled: isLogged,
    queryFn: getCurrentUser,
    queryKey: authQueryKeys.currentUser,
  })
}

export function usePermissionsQuery() {
  const isLogged = useAuthStore((state) => state.isLogged)

  return useQuery({
    enabled: isLogged,
    queryFn: getPermissions,
    queryKey: authQueryKeys.permissions,
  })
}

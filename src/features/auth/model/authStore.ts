import { create } from "zustand"

export type AuthDialogMode = "login" | "register"

type AuthSession = {
  userId: number | string
}

type AuthStore = {
  dialogMode: AuthDialogMode
  isLogged: boolean
  loginRedirect: string | null
  showLoginDialog: boolean
  userId: string | null
  closeLoginDialog: () => void
  logout: (options?: { openLogin?: boolean; redirectTo?: string }) => void
  openLoginDialog: (redirectTo?: string, mode?: AuthDialogMode) => void
  setDialogMode: (mode: AuthDialogMode) => void
  setSession: (session: AuthSession) => void
}

function getCookie(name: string) {
  const prefix = `${name}=`
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length)
}

function getInitialUserId() {
  return window.localStorage.getItem("userId")
}

function hasInitialCookieSession() {
  return Boolean(getCookie(import.meta.env.VITE_CSRF_COOKIE_NAME ?? "jh_csrf"))
}

function clearLegacyToken() {
  window.localStorage.removeItem("token")
}

clearLegacyToken()

export const useAuthStore = create<AuthStore>((set) => ({
  dialogMode: "login",
  isLogged: hasInitialCookieSession(),
  loginRedirect: window.localStorage.getItem("loginRedirect"),
  showLoginDialog: false,
  userId: getInitialUserId(),
  closeLoginDialog: () => set({ showLoginDialog: false }),
  logout: (options) => {
    clearLegacyToken()
    window.localStorage.removeItem("userId")

    if (options?.redirectTo) {
      window.localStorage.setItem("loginRedirect", options.redirectTo)
    }

    set({
      dialogMode: "login",
      isLogged: false,
      loginRedirect: options?.redirectTo ?? null,
      showLoginDialog: options?.openLogin ?? false,
      userId: null,
    })
  },
  openLoginDialog: (redirectTo, mode = "login") => {
    if (redirectTo) {
      window.localStorage.setItem("loginRedirect", redirectTo)
    }

    set({ dialogMode: mode, loginRedirect: redirectTo ?? null, showLoginDialog: true })
  },
  setDialogMode: (mode) => set({ dialogMode: mode }),
  setSession: ({ userId }) => {
    const normalizedUserId = String(userId)
    clearLegacyToken()
    window.localStorage.setItem("userId", normalizedUserId)
    window.localStorage.removeItem("loginRedirect")

    set({
      isLogged: true,
      loginRedirect: null,
      showLoginDialog: false,
      userId: normalizedUserId,
    })
  },
}))

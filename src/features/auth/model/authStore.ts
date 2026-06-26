import { create } from "zustand"

export type AuthDialogMode = "login" | "register"

type AuthSession = {
  token: string
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

function getInitialUserId() {
  return window.localStorage.getItem("userId")
}

function hasInitialToken() {
  return Boolean(window.localStorage.getItem("token"))
}

export const useAuthStore = create<AuthStore>((set) => ({
  dialogMode: "login",
  isLogged: hasInitialToken(),
  loginRedirect: window.localStorage.getItem("loginRedirect"),
  showLoginDialog: false,
  userId: getInitialUserId(),
  closeLoginDialog: () => set({ showLoginDialog: false }),
  logout: (options) => {
    window.localStorage.removeItem("token")
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
  setSession: ({ token, userId }) => {
    const normalizedUserId = String(userId)
    window.localStorage.setItem("token", token)
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

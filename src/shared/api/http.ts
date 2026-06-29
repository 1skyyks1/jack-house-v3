import axios, { AxiosHeaders } from "axios"
import { useAuthStore } from "@/features/auth/model/authStore"
import { i18n } from "@/shared/i18n/client"
import { getBackendMessage } from "./contracts/unwrap"
import { ApiError, getApiErrorKind } from "./errors"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3000"

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  withCredentials: true,
})

function getCookie(name: string) {
  const prefix = `${name}=`
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length)
}

function isUnsafeMethod(method: string | undefined) {
  return !["get", "head", "options"].includes((method ?? "get").toLowerCase())
}

type CsrfResponse = {
  data?: {
    csrfToken?: string
  }
}

let csrfTokenCache: string | null = null
let csrfTokenRequest: Promise<string | null> | null = null

async function fetchCsrfToken() {
  if (csrfTokenCache) return csrfTokenCache
  if (csrfTokenRequest) return csrfTokenRequest

  csrfTokenRequest = axios
    .get<CsrfResponse>(`${API_BASE_URL}/auth/csrf`, {
      headers: {
        "Accept-Language": i18n.language,
        "Cache-Control": "no-store",
      },
      withCredentials: true,
    })
    .then((response) => {
      csrfTokenCache = response.data.data?.csrfToken ?? null
      return csrfTokenCache
    })
    .catch(() => null)
    .finally(() => {
      csrfTokenRequest = null
    })

  return csrfTokenRequest
}

http.interceptors.request.use(async (config) => {
  const headers = AxiosHeaders.from(config.headers)
  headers.set("Accept-Language", i18n.language)

  let csrfToken = getCookie(import.meta.env.VITE_CSRF_COOKIE_NAME ?? "jh_csrf")
  if (!csrfToken && isUnsafeMethod(config.method)) {
    csrfToken = (await fetchCsrfToken()) ?? undefined
  }

  if (csrfToken) {
    headers.set("X-CSRF-Token", decodeURIComponent(csrfToken))
  }

  config.headers = headers
  return config
})

http.interceptors.response.use(
  (response) => {
    if (response.config.url?.startsWith("/auth/")) {
      csrfTokenCache = null
    }

    return response.data
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const backendMessage = getBackendMessage(error.response?.data)

      if (status === 403) {
        csrfTokenCache = null
      }

      if (status === 401) {
        csrfTokenCache = null
        useAuthStore.getState().logout({ openLogin: true, redirectTo: window.location.pathname + window.location.search })
      }

      throw new ApiError(
        backendMessage ?? error.message ?? "Request failed",
        getApiErrorKind(status),
        status,
      )
    }

    throw new ApiError("Unknown request error")
  },
)

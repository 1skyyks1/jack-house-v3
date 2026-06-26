import axios from "axios"
import { useAuthStore } from "@/features/auth/model/authStore"
import { i18n } from "@/shared/i18n/client"
import { getBackendMessage } from "./contracts/unwrap"
import { ApiError, getApiErrorKind } from "./errors"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3000"

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
})

http.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = i18n.language

  const token = window.localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const backendMessage = getBackendMessage(error.response?.data)

      if (status === 401) {
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

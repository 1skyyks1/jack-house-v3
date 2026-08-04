import { createAnalytics } from "@jack-house-analytics/core"
import { bindReactRouter } from "@jack-house-analytics/react"
import { router } from "@/app/router"
import { useAuthStore } from "@/features/auth/model/authStore"
import { API_BASE_URL } from "@/shared/api/http"

const analyticsEnabled = import.meta.env.VITE_ANALYTICS_ENABLED !== "false"

export const analytics = createAnalytics({
  appId: import.meta.env.VITE_ANALYTICS_APP_ID ?? "jack-house-v3",
  debug: import.meta.env.DEV,
  endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT ?? `${API_BASE_URL}/analytics/collect`,
  features: {
    activeTime: false,
    context: true,
    pageViews: true,
  },
  getUserId: () => useAuthStore.getState().userId,
})

let analyticsStarted = false

export function startAnalytics() {
  if (!analyticsEnabled || analyticsStarted) {
    return
  }

  analyticsStarted = true
  bindReactRouter(analytics, router)
  analytics.start()
}

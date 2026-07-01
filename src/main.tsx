import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { AppProviders } from "./app/providers"
import { startAnalytics } from "@/shared/analytics/client"
import "./index.css"

startAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)

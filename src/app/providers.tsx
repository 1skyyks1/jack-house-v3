import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { I18nextProvider } from "react-i18next"
import { Toaster } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { i18n } from "@/shared/i18n/client"
import { ThemeProvider } from "@/shared/components/ThemeProvider"
import { queryClient } from "./queryClient"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors />
          </TooltipProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}

import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { getErrorMessage } from "./getErrorMessage"

type AppAlertTone = "default" | "destructive" | "success" | "warning"

type AppAlertProps = {
  children?: ReactNode
  className?: string
  title?: ReactNode
  tone?: AppAlertTone
}

const iconByTone = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle,
  warning: WarningCircle,
} satisfies Record<AppAlertTone, typeof Info>

export function AppAlert({ children, className, title, tone = "default" }: AppAlertProps) {
  const Icon = iconByTone[tone]

  return (
    <Alert
      className={cn(
        tone === "success" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
        tone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        className,
      )}
      variant={tone === "destructive" ? "destructive" : "default"}
    >
      <Icon className="size-4" weight="bold" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children ? <AlertDescription>{children}</AlertDescription> : null}
    </Alert>
  )
}

type MutationErrorAlertProps = {
  className?: string
  error: unknown
  title?: ReactNode
}

export function MutationErrorAlert({ className, error, title = "Request failed" }: MutationErrorAlertProps) {
  return (
    <AppAlert className={className} tone="destructive" title={title}>
      {getErrorMessage(error)}
    </AppAlert>
  )
}

import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react"
import { useEffect, type ReactNode } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { i18n } from "@/shared/i18n/client"
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

export function MutationErrorAlert({ error, title }: MutationErrorAlertProps) {
  const message = error ? getErrorMessage(error) : ""
  const toastTitle = title ?? i18n.t("common.requestFailed")
  const titleKey = typeof toastTitle === "string" ? toastTitle : "request-failed"

  useEffect(() => {
    if (!error) return
    toast.error(toastTitle, {
      description: message,
      id: `mutation-error:${titleKey}:${message}`,
    })
  }, [error, message, titleKey, toastTitle])

  return null
}

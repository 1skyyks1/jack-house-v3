import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminPageProps = {
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function AdminPage({ actions, children, className }: AdminPageProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
      {children}
    </div>
  )
}

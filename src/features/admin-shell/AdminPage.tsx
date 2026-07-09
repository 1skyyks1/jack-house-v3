import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminPageProps = {
  actions?: ReactNode
  breadcrumb?: ReactNode
  children: ReactNode
  className?: string
}

export function AdminPage({ actions, breadcrumb, children, className }: AdminPageProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {breadcrumb || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {breadcrumb ? <div className="min-w-0">{breadcrumb}</div> : null}
          {actions ? <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}

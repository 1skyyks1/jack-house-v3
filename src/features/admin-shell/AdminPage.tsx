import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AdminPageProps = {
  actions?: ReactNode
  breadcrumb?: ReactNode
  children: ReactNode
  className?: string
  headerCenter?: ReactNode
}

export function AdminPage({ actions, breadcrumb, children, className, headerCenter }: AdminPageProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {breadcrumb || headerCenter || actions ? (
        headerCenter ? (
          <div className="grid items-center gap-3 lg:grid-cols-3">
            <div className="min-w-0">{breadcrumb}</div>
            <div className="flex min-w-0 justify-center">{headerCenter}</div>
            <div className="flex min-w-0 flex-wrap justify-center gap-2 lg:justify-end">{actions}</div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {breadcrumb ? <div className="min-w-0">{breadcrumb}</div> : null}
            {actions ? <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2">{actions}</div> : null}
          </div>
        )
      ) : null}
      {children}
    </div>
  )
}

import type { ReactNode } from "react"

type AdminPageProps = {
  actions?: ReactNode
  children: ReactNode
}

export function AdminPage({ actions, children }: AdminPageProps) {
  return (
    <div className="flex flex-col gap-4">
      {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
      {children}
    </div>
  )
}

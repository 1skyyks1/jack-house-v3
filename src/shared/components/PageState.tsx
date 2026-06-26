import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageStateProps = {
  action?: ReactNode
  className?: string
  description: ReactNode
  title: ReactNode
}

export function PageState({ action, className, description, title }: PageStateProps) {
  return (
    <section className={cn("mx-auto max-w-2xl rounded-lg border bg-card p-8 text-center", className)}>
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <div className="mt-3 text-sm text-muted-foreground">{description}</div>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  )
}

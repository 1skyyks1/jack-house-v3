import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageStateProps = {
  action?: ReactNode
  className?: string
  description: ReactNode
  headingLevel?: "h1" | "h2"
  title: ReactNode
}

export function PageState({ action, className, description, headingLevel = "h1", title }: PageStateProps) {
  const Heading = headingLevel

  return (
    <section className={cn("mx-auto max-w-2xl px-4 py-16 text-center sm:py-20", className)}>
      <Heading className="font-heading text-2xl font-semibold">{title}</Heading>
      <div className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</div>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  )
}

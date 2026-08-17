import type { ReactNode } from "react"

type SectionTitleProps = {
  children: ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="flex items-center gap-2.5 font-heading text-lg font-semibold">
      <span aria-hidden="true" className="h-4 w-1 bg-primary" />
      {children}
    </h2>
  )
}

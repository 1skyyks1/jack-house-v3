import { Suspense, type ReactNode } from "react"
import { PageSkeleton } from "@/shared/components"

type LazyRouteProps = {
  children: ReactNode
}

export function LazyRoute({ children }: LazyRouteProps) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

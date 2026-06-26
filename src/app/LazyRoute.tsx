import { Suspense, type ReactNode } from "react"

type LazyRouteProps = {
  children: ReactNode
}

export function LazyRoute({ children }: LazyRouteProps) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

function RouteFallback() {
  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </section>
  )
}

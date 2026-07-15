import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type SkeletonProps = {
  className?: string
}

type RepeatedSkeletonProps = SkeletonProps & {
  count?: number
}

export function PageSkeleton({ className }: SkeletonProps) {
  return (
    <section aria-busy="true" aria-label="Loading" className={cn("mx-auto w-full max-w-6xl space-y-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-9 w-[min(22rem,72%)] rounded-lg" />
        <Skeleton className="h-4 w-[min(34rem,90%)] rounded-md" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    </section>
  )
}

export function DetailPageSkeleton({ className }: SkeletonProps) {
  return (
    <section aria-busy="true" aria-label="Loading" className={cn("mx-auto w-full max-w-6xl space-y-5", className)}>
      <Skeleton className="h-4 w-36 rounded-md" />
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    </section>
  )
}

export function FormPageSkeleton({ className }: SkeletonProps) {
  return (
    <section aria-busy="true" aria-label="Loading" className={cn("w-full space-y-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-4 w-[min(32rem,85%)] rounded-md" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="space-y-2" key={index}>
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-28 rounded-md" />
    </section>
  )
}

export function CardGridSkeleton({ className, count = 4 }: RepeatedSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading" className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="h-28 rounded-xl" key={index} />
      ))}
    </div>
  )
}

export function ListSkeleton({ className, count = 4 }: RepeatedSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading" className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div className="flex items-center gap-3" key={index}>
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-[min(18rem,70%)] rounded-md" />
            <Skeleton className="h-3 w-[min(26rem,92%)] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InlineSkeleton({ className, count = 3 }: RepeatedSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Loading" className={cn("flex flex-wrap gap-2", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="h-7 w-20 rounded-full" key={index} />
      ))}
    </div>
  )
}

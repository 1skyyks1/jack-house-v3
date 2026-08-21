import { Badge } from "@/components/ui/badge"
import { getUserRoleLabel, getUserStatusLabel, type UserRole, type UserStatus } from "@/entities/user"
import { cn } from "@/lib/utils"

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      className={cn(
        role === 2 && "border-violet-500/25 bg-violet-500/12 text-violet-700 dark:text-violet-300",
        role === 1 && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        role === 0 && "bg-muted text-muted-foreground",
      )}
      variant="outline"
    >
      {getUserRoleLabel(role)}
    </Badge>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge
      className={cn(
        status === 0 && "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        status === 1 && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        status === 2 && "bg-destructive/10 text-destructive",
      )}
      variant="outline"
    >
      {getUserStatusLabel(status)}
    </Badge>
  )
}

export function UserProfileState({ compact = false, description, title }: { compact?: boolean; description: string; title: string }) {
  return (
    <div className={cn("text-center", compact ? "py-8" : "py-14")}>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function UserProfileSkeleton() {
  return (
    <section className="space-y-10">
      <div className="py-7">
        <div className="flex items-center gap-4 sm:items-end sm:gap-6">
          <div className="size-18 shrink-0 animate-pulse rounded-full bg-muted sm:size-28" />
          <div className="flex-1 space-y-4">
            <div className="h-12 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[1fr_17rem]">
        <div className="h-96 animate-pulse bg-muted/60" />
        <div className="h-72 animate-pulse bg-muted/60" />
      </div>
    </section>
  )
}

export function UserPostsSkeleton({ count = 4, variant = "post" }: { count?: number; variant?: "post" | "submission" }) {
  return (
    <div aria-hidden="true" className="space-y-1">
      {Array.from({ length: count }, (_, index) => (
        variant === "submission" ? (
          <div className="flex items-start justify-between gap-3 rounded-lg p-3" key={index}>
            <div className="min-w-0 flex-1">
              <div className="flex h-6 items-center gap-2">
                <div className="size-4 shrink-0 animate-pulse rounded bg-muted" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              </div>
              <div className="mt-1 h-4 w-24 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-5 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
          </div>
        ) : (
          <div className="flex h-12 items-center justify-between gap-4 rounded-lg px-3" key={index}>
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 shrink-0 animate-pulse rounded bg-muted" />
          </div>
        )
      ))}
    </div>
  )
}

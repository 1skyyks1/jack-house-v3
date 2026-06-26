import { Badge } from "@/components/ui/badge"
import { getUserRoleLabel, getUserStatusLabel, type UserRole, type UserStatus } from "@/entities/user"
import { cn } from "@/lib/utils"

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge
      className={cn(
        role === 2 && "bg-primary/10 text-primary",
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
    <div className={cn("rounded-lg border bg-card text-center", compact ? "border-0 p-8" : "p-10")}>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function UserProfileSkeleton() {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="size-24 animate-pulse rounded-lg bg-muted sm:size-28" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-11 w-24 animate-pulse rounded bg-muted" />
              <div className="h-11 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
      </div>
    </section>
  )
}

export function UserPostsSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="space-y-3 p-4" key={index}>
          <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

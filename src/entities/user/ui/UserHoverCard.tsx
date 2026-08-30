import type { ReactNode } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

type UserHoverCardProps = {
  avatar?: string | null
  children: ReactNode
  className?: string
  userId: number | string
  userName: string
}

export function UserHoverCard({ avatar, children, className, userId, userName }: UserHoverCardProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className={cn("w-60 overflow-hidden p-0", className)}>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-popover to-accent/25 p-3">
          {avatar ? (
            <img alt="" aria-hidden className="absolute inset-0 size-full scale-125 object-cover opacity-10 blur-xl" src={avatar} />
          ) : null}
          <div className="relative flex items-center gap-3">
            <Avatar className="size-11 rounded-xl bg-popover/70 after:rounded-xl">
              {avatar ? <AvatarImage alt="" className="rounded-xl" src={avatar} /> : null}
              <AvatarFallback className="rounded-xl font-semibold">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">{userName}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">ID #{userId}</p>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

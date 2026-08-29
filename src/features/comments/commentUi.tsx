import { Trash } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { getUserRoleLabel, type UserRole } from "@/entities/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { formatDate } from "@/shared/lib/date"

type CommentListItemProps = {
  avatar: string | null
  canDelete: boolean
  content: string
  createdTime: string
  isDeleting: boolean
  onDelete: () => void
  role?: UserRole
  userId: number
  userName: string
}

export function CommentListItem({
  avatar,
  canDelete,
  content,
  createdTime,
  isDeleting,
  onDelete,
  role,
  userId,
  userName,
}: CommentListItemProps) {
  const { t } = useTranslation()

  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Link className="mt-0.5 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" to={`/user/${userId}`}>
            <Avatar>
              {avatar ? <AvatarImage alt={userName} src={avatar} /> : null}
              <AvatarFallback>{getAvatarFallback(userName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link className="font-medium hover:text-primary hover:underline" to={`/user/${userId}`}>
                {userName}
              </Link>
              <CommentRoleBadge role={role} />
              <span className="text-xs text-muted-foreground">{formatDate(createdTime)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
          </div>
        </div>
        {canDelete ? (
          <Button
            aria-label={t("post.detail.deleteAriaLabel")}
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={isDeleting}
            onClick={onDelete}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Trash className="size-4" weight="bold" />
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function CommentRoleBadge({ role }: { role?: UserRole }) {
  const { t } = useTranslation()

  return (
    <Badge variant="secondary">
      {role === undefined ? t("common.member") : getUserRoleLabel(role)}
    </Badge>
  )
}

type CommentPaginationProps = {
  onPageChange: (page: number | ((page: number) => number)) => void
  page: number
  totalPages: number
}

export function CommentPagination({ onPageChange, page, totalPages }: CommentPaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
      <Pagination className="mx-0 w-auto justify-start">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={page <= 1}
              className={cn(page <= 1 && "pointer-events-none opacity-40")}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onPageChange((currentPage) => Math.max(currentPage - 1, 1))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <span className="text-muted-foreground">
        {t("common.pageStatus", { page, total: totalPages })}
      </span>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationNext
              aria-disabled={page >= totalPages}
              className={cn(page >= totalPages && "pointer-events-none opacity-40")}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                onPageChange((currentPage) => Math.min(currentPage + 1, totalPages))
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

type CommentStateProps = {
  description: string
  icon?: ReactNode
  title: string
}

export function CommentState({ description, icon, title }: CommentStateProps) {
  return (
    <div className={cn("text-center", icon ? "py-5" : "p-5")}>
      {icon ? <div className="mx-auto mb-2 grid size-8 place-items-center text-primary/60 [&>svg]:size-6">{icon}</div> : null}
      <h3 className={cn("font-heading", icon ? "text-sm font-medium text-muted-foreground" : "text-lg font-semibold")}>{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function CommentSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function getAvatarFallback(name: string | null | undefined) {
  return name?.trim().slice(0, 2).toUpperCase() || "JH"
}

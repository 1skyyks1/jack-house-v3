import { CalendarBlank, DiscordLogo, FileArrowUp, IdentificationBadge, LinkSimple, NumberCircleOne, UserCircle } from "@phosphor-icons/react"
import type { ComponentType, ReactNode } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  resolvePostListTitle,
  useUserPostListQuery,
  type PostListItem,
} from "@/entities/post"
import {
  formatFileSize,
  getPostFileStatusLabel,
  useUserPostFileListQuery,
  type PostFileStatus,
  type PublicPostFileListItem,
} from "@/entities/post-file"
import {
  getUserRoleLabel,
  getUserStatusLabel,
  useUserDetailQuery,
  type UserBadge,
  type UserProfile,
} from "@/entities/user"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/shared/i18n/client"
import { formatDate } from "@/shared/lib/date"
import { getErrorMessage } from "@/shared/components"
import { UserPostsSkeleton, UserProfileSkeleton, UserProfileState, UserRoleBadge, UserStatusBadge } from "./components"
import { getPaginationItems, parsePage } from "./utils"

const USER_POST_PAGE_SIZE = 5
const USER_POST_FILE_PAGE_SIZE = 5

export function UserProfilePage() {
  const { userId } = useParams()
  const { i18n, t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const postPage = parsePage(searchParams.get("postPage"))
  const postFilePage = parsePage(searchParams.get("postFilePage"))
  const locale = i18n.language === "en" ? "en" : "zh"

  const userQuery = useUserDetailQuery(userId)
  const postsQuery = useUserPostListQuery(
    userId ? { page: postPage, pageSize: USER_POST_PAGE_SIZE, userId } : undefined,
  )
  const postFilesQuery = useUserPostFileListQuery(
    userId ? { page: postFilePage, pageSize: USER_POST_FILE_PAGE_SIZE, userId } : undefined,
  )

  const setPostPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("postPage", String(nextPage))
    setSearchParams(nextParams)
  }

  const setPostFilePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("postFilePage", String(nextPage))
    setSearchParams(nextParams)
  }

  if (!userId) {
    return <UserProfileState title={t("user.profile.missingTitle")} description={t("user.profile.missingDescription")} />
  }

  if (userQuery.isLoading) {
    return <UserProfileSkeleton />
  }

  if (userQuery.isError) {
    return <UserProfileState title={t("user.profile.loadFailedTitle")} description={getErrorMessage(userQuery.error)} />
  }

  if (!userQuery.data) {
    return <UserProfileState title={t("user.profile.notFoundTitle")} description={t("user.profile.notFoundDescription")} />
  }

  return (
    <section className="space-y-6">
      <UserHero user={userQuery.data} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <UserInfoPanel user={userQuery.data} />
        <div className="space-y-6">
          <UserPostsPanel
            locale={locale as AppLocale}
            onPageChange={setPostPage}
            postsQuery={postsQuery}
          />
          <UserPostFilesPanel
            onPageChange={setPostFilePage}
            postFilesQuery={postFilesQuery}
          />
        </div>
      </div>
    </section>
  )
}

type UserHeroProps = {
  user: UserProfile
}

function UserHero({ user }: UserHeroProps) {
  const { t } = useTranslation()
  const initials = user.user_name.trim().slice(0, 2).toUpperCase() || "JH"

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted sm:size-28">
          {user.avatar ? (
            <img alt="" className="size-full object-cover" src={user.avatar} />
          ) : (
            <span className="font-heading text-3xl font-semibold text-muted-foreground">{initials}</span>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-heading text-3xl font-semibold">{user.user_name}</h1>
              <UserRoleBadge role={user.role} />
              <UserStatusBadge status={user.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t("user.profile.uid", { id: user.user_id })}</p>
          </div>

          <UserBadges badges={user.badges ?? []} />
        </div>
      </div>
    </section>
  )
}

type UserBadgesProps = {
  badges: UserBadge[]
}

function UserBadges({ badges }: UserBadgesProps) {
  if (badges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const badgeImage = badge.signedUrl ?? badge.url
        const badgeContent = badgeImage ? (
          <img alt={badge.name} className="h-11 w-24 border object-cover" src={badgeImage} />
        ) : (
          <span className="inline-flex h-11 min-w-24 items-center justify-center rounded border px-3 text-xs font-medium">
            {badge.name}
          </span>
        )
        const badgeElement = badge.redirect_url ? (
          <a
            aria-label={badge.name}
            className="block transition hover:opacity-80"
            href={badge.redirect_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {badgeContent}
          </a>
        ) : (
          <span>{badgeContent}</span>
        )

        return (
          <Tooltip key={badge.id}>
            <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
            <TooltipContent>{badge.name}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

type UserInfoPanelProps = {
  user: UserProfile
}

function UserInfoPanel({ user }: UserInfoPanelProps) {
  const { t } = useTranslation()
  const osuUrl = user.osu_uid ? `https://osu.ppy.sh/u/${user.osu_uid}` : null

  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="font-heading text-xl font-semibold">{t("user.profile.infoTitle")}</h2>
      <div className="mt-4 divide-y text-sm">
        <InfoRow icon={IdentificationBadge} label={t("user.profile.role")} value={getUserRoleLabel(user.role)} />
        <InfoRow icon={NumberCircleOne} label={t("user.profile.status")} value={getUserStatusLabel(user.status)} />
        <InfoRow icon={CalendarBlank} label={t("user.profile.joined")} value={formatDate(user.created_time)} />
        <InfoRow
          icon={LinkSimple}
          label={t("user.profile.osu")}
          value={
            osuUrl ? (
              <a className="font-medium text-primary hover:underline" href={osuUrl} rel="noopener noreferrer" target="_blank">
                {osuUrl}
              </a>
            ) : (
              t("common.notConnected")
            )
          }
        />
        <InfoRow icon={UserCircle} label={t("user.profile.qq")} value={<CopyableContact value={user.qq} />} />
        <InfoRow icon={DiscordLogo} label={t("user.profile.discord")} value={<CopyableContact value={user.discord} />} />
      </div>
    </section>
  )
}

function CopyableContact({ value }: { value: string | null | undefined }) {
  const { t } = useTranslation()
  const contact = value?.trim()

  if (!contact) return t("common.notProvided")

  const copyContact = async () => {
    try {
      await window.navigator.clipboard.writeText(contact)
      toast.success(t("common.copied"))
    } catch {
      toast.error(t("common.copyFailed"))
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button className="h-auto min-w-0 px-0 py-0 font-medium" onClick={copyContact} type="button" variant="link">
          <span className="truncate">{contact}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("common.copy")}</TooltipContent>
    </Tooltip>
  )
}

type InfoRowProps = {
  icon: ComponentType<{ className?: string; weight?: "bold" }>
  label: string
  value: ReactNode
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <div className="flex items-center gap-2 font-medium text-muted-foreground">
        <Icon className="size-4" weight="bold" />
        {label}
      </div>
      <div className="min-w-0 break-words text-foreground">{value}</div>
    </div>
  )
}

type UserPostsPanelProps = {
  locale: AppLocale
  onPageChange: (page: number) => void
  postsQuery: ReturnType<typeof useUserPostListQuery>
}

function UserPostsPanel({ locale, onPageChange, postsQuery }: UserPostsPanelProps) {
  const { t } = useTranslation()
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <h2 className="font-heading text-xl font-semibold">{t("user.profile.posts")}</h2>
        {postsQuery.data ? (
          <span className="text-sm text-muted-foreground">{t("common.totalCount", { count: postsQuery.data.total })}</span>
        ) : null}
      </div>

      {postsQuery.isLoading ? (
        <UserPostsSkeleton />
      ) : postsQuery.isError ? (
        <UserProfileState title={t("user.profile.postsLoadFailed")} description={getErrorMessage(postsQuery.error)} compact />
      ) : postsQuery.data && postsQuery.data.data.length > 0 ? (
        <>
          <div className="divide-y">
            {postsQuery.data.data.map((post) => (
              <UserPostRow key={post.post_id} locale={locale} post={post} />
            ))}
          </div>
          <UserPostPagination
            onPageChange={onPageChange}
            page={postsQuery.data.page}
            totalPages={postsQuery.data.totalPages}
          />
        </>
      ) : (
        <UserProfileState title={t("user.profile.noPostsTitle")} description={t("user.profile.noPostsDescription")} compact />
      )}
    </section>
  )
}

type UserPostFilesPanelProps = {
  onPageChange: (page: number) => void
  postFilesQuery: ReturnType<typeof useUserPostFileListQuery>
}

function UserPostFilesPanel({ onPageChange, postFilesQuery }: UserPostFilesPanelProps) {
  const { t } = useTranslation()
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-5">
        <h2 className="font-heading text-xl font-semibold">{t("user.profile.submissions")}</h2>
        {postFilesQuery.data ? (
          <span className="text-sm text-muted-foreground">{t("common.totalCount", { count: postFilesQuery.data.total })}</span>
        ) : null}
      </div>

      {postFilesQuery.isLoading ? (
        <UserPostsSkeleton />
      ) : postFilesQuery.isError ? (
        <UserProfileState title={t("user.profile.submissionsLoadFailed")} description={getErrorMessage(postFilesQuery.error)} compact />
      ) : postFilesQuery.data && postFilesQuery.data.data.length > 0 ? (
        <>
          <div className="divide-y">
            {postFilesQuery.data.data.map((file) => (
              <UserPostFileRow file={file} key={file.file_id} />
            ))}
          </div>
          <UserPostPagination
            onPageChange={onPageChange}
            page={postFilesQuery.data.page}
            totalPages={postFilesQuery.data.totalPages}
          />
        </>
      ) : (
        <UserProfileState title={t("user.profile.noSubmissionsTitle")} description={t("user.profile.noSubmissionsDescription")} compact />
      )}
    </section>
  )
}

function UserPostFileRow({ file }: { file: PublicPostFileListItem }) {
  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileArrowUp className="size-4 shrink-0 text-muted-foreground" weight="bold" />
            <span className="break-words font-medium">{file.file_name}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{formatDate(file.uploaded_time)}</span>
            <span>{formatFileSize(file.size)}</span>
          </div>
        </div>
        <PostFileStatusBadge status={file.status} />
      </div>
    </div>
  )
}

function PostFileStatusBadge({ status }: { status: PostFileStatus }) {
  return <Badge className={getPostFileStatusClassName(status)} variant="outline">{getPostFileStatusLabel(status)}</Badge>
}

function getPostFileStatusClassName(status: PostFileStatus) {
  if (status === 1) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === 2) return "border-destructive/25 bg-destructive/10 text-destructive"
  return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
}

type UserPostRowProps = {
  locale: AppLocale
  post: PostListItem
}

function UserPostRow({ locale, post }: UserPostRowProps) {
  return (
    <Link className="block p-4 transition hover:bg-accent/60" to={`/post/${post.post_id}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="break-words font-medium">{resolvePostListTitle(post, locale)}</h3>
        <span className="shrink-0 text-sm text-muted-foreground">{formatDate(post.created_time)}</span>
      </div>
    </Link>
  )
}

type UserPostPaginationProps = {
  onPageChange: (page: number) => void
  page: number
  totalPages: number
}

function UserPostPagination({ onPageChange, page, totalPages }: UserPostPaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null
  const pageItems = getPaginationItems(page, totalPages)

  return (
    <div className="flex flex-col items-center gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:justify-between">
      <span className="text-muted-foreground">
        {t("common.pageStatus", { page, total: totalPages })}
      </span>
      <Pagination className="mx-0 w-auto justify-center sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={page <= 1}
              className={cn(page <= 1 && "pointer-events-none opacity-40")}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (page > 1) onPageChange(page - 1)
              }}
            />
          </PaginationItem>
          {pageItems.map((item, index) => (
            <PaginationItem key={`${item}-${index}`}>
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(event) => {
                    event.preventDefault()
                    if (item !== page) onPageChange(item)
                  }}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              aria-disabled={page >= totalPages}
              className={cn(page >= totalPages && "pointer-events-none opacity-40")}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (page < totalPages) onPageChange(page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

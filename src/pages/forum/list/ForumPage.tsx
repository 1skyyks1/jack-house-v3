import { ArrowRight, CalendarBlank, ChatText, Clock, Flag, MagnifyingGlass, Megaphone, NotePencil, User } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  isPostSubmissionActive,
  resolvePostListTitle,
  usePostListQuery,
  usePostSearchQuery,
  type PostListItem,
  type PostSearchResult,
  type PostType,
  type PostTypeFilter,
} from "@/entities/post"
import { i18n, type AppLocale } from "@/shared/i18n/client"
import { getErrorMessage, ListSkeleton } from "@/shared/components"
import { cn } from "@/lib/utils"
import { formatDate } from "@/shared/lib/date"

const PAGE_SIZE = 8
const SEARCH_PAGE_SIZE = 8

const postTypeFilters: PostTypeFilter[] = [-1, 0, 1, 2, 3]

export function ForumPage() {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchKeyword, setSearchKeyword] = useState("")
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const type = parseTypeFilter(searchParams.get("type"))
  const page = parsePage(searchParams.get("page"))
  const locale = i18n.language === "en" ? "en" : "zh"
  const postListQuery = usePostListQuery({ page, pageSize: PAGE_SIZE, type })
  const searchQuery = usePostSearchQuery({
    keyword: debouncedSearchKeyword.trim(),
    locale,
    page: 1,
    pageSize: SEARCH_PAGE_SIZE,
  })

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchKeyword])

  const setType = (nextType: PostTypeFilter) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", "1")

    if (nextType === -1) {
      nextParams.delete("type")
    } else {
      nextParams.set("type", String(nextType))
    }

    setSearchParams(nextParams)
  }

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("page", String(nextPage))
    setSearchParams(nextParams)
  }

  const openPost = (postId: number) => {
    setIsSearchOpen(false)
    setSearchKeyword("")
    setDebouncedSearchKeyword("")
    navigate(`/post/${postId}`)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <ForumSearchBox
          isOpen={isSearchOpen}
          isSearching={searchQuery.isFetching}
          keyword={searchKeyword}
          onKeywordChange={(value) => {
            setSearchKeyword(value)
            setIsSearchOpen(value.trim().length > 0)
          }}
          onOpenChange={setIsSearchOpen}
          onPostSelect={openPost}
          results={searchQuery.data ?? []}
          searchError={searchQuery.error}
        />

        <div className="flex flex-wrap items-center gap-2">
          {postTypeFilters.map((filter) => (
            <Button
              key={filter}
              type="button"
              aria-pressed={type === filter}
              onClick={() => setType(filter)}
              className={cn(type !== filter && "text-muted-foreground")}
              variant={type === filter ? "default" : "outline"}
            >
              {getPostTypeFilterLabel(filter, t)}
            </Button>
          ))}
        </div>

        <Button asChild className="shrink-0">
          <Link to="/forum/editor">
            <NotePencil className="size-4" weight="bold" />
            {t("forum.newPost")}
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {postListQuery.isLoading ? (
          <ForumListSkeleton />
        ) : postListQuery.isError ? (
          <ForumState title={t("forum.states.loadFailed")} description={getErrorMessage(postListQuery.error)} />
        ) : postListQuery.data && postListQuery.data.data.length > 0 ? (
          <>
            <div className="space-y-3">
              {postListQuery.data.data.map((post) => (
                <PostListCard key={post.post_id} locale={locale as AppLocale} post={post} />
              ))}
            </div>
            <ForumPagination
              page={postListQuery.data.page}
              totalPages={postListQuery.data.totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <ForumState title={t("forum.states.emptyTitle")} description={t("forum.states.emptyDescription")} />
        )}
      </div>
    </section>
  )
}

type ForumSearchBoxProps = {
  isOpen: boolean
  isSearching: boolean
  keyword: string
  onKeywordChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onPostSelect: (postId: number) => void
  results: PostSearchResult[]
  searchError: unknown
}

function ForumSearchBox({
  isOpen,
  isSearching,
  keyword,
  onKeywordChange,
  onOpenChange,
  onPostSelect,
  results,
  searchError,
}: ForumSearchBoxProps) {
  const { t } = useTranslation()
  const hasKeyword = keyword.trim().length > 0

  return (
    <Popover open={isOpen && hasKeyword} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative min-w-64 flex-1">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" weight="bold" />
          <Input
            className="pl-9"
            onChange={(event) => {
              onKeywordChange(event.target.value)
            }}
            onFocus={() => {
              if (hasKeyword) onOpenChange(true)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) {
                event.preventDefault()
                onPostSelect(results[0].post_id)
              }
              if (event.key === "Escape") {
                onOpenChange(false)
              }
            }}
            placeholder={t("forum.searchPlaceholder")}
            value={keyword}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(calc(100vw-2rem),28rem)] p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandList>
            {isSearching ? (
              <ListSkeleton className="p-3" count={3} />
            ) : searchError ? (
              <CommandEmpty>{getErrorMessage(searchError)}</CommandEmpty>
            ) : results.length === 0 ? (
              <CommandEmpty>{t("forum.noMatchingPosts")}</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((post) => (
                  <CommandItem
                    key={post.post_id}
                    onSelect={() => onPostSelect(post.post_id)}
                    value={`${post.post_id}-${resolvePostSearchTitle(post)}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{resolvePostSearchTitle(post)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatNullableDate(post.time)}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type PostListCardProps = {
  locale: AppLocale
  post: PostListItem
}

function PostListCard({ locale, post }: PostListCardProps) {
  const { t } = useTranslation()
  const title = resolvePostListTitle(post, locale)
  const meta = getPostTypeMeta(post.type)
  const Icon = meta.icon
  const isRequest = Number(post.type) === 1
  const isAnnouncement = Number(post.type) === 3

  return (
    <Card
      size="sm"
      className={cn(
        "group relative gap-0 overflow-hidden py-0 transition hover:-translate-y-0.5 hover:ring-foreground/20",
        isAnnouncement && "bg-amber-500/5 ring-amber-500/20",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.accentClassName)} />
      <Link className="block p-4 pl-5 sm:p-5 sm:pl-6" to={`/post/${post.post_id}`}>
        <div className="flex gap-4">
          <div className={cn("mt-0.5 hidden size-10 shrink-0 place-items-center rounded-xl sm:grid", meta.iconClassName)}>
            <Icon className="size-5" weight="bold" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <PostTypeBadge type={post.type} />
              {isRequest ? <SubmissionBadge end={post.end} /> : null}
              {post.end && isRequest ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" weight="bold" />
                  {formatDate(post.end)}
                </span>
              ) : null}
            </div>

            <div className="flex items-start justify-between gap-4">
              <h2 className="break-words font-heading text-lg font-semibold leading-snug text-foreground transition group-hover:text-primary">
                {title}
              </h2>
              <ArrowRight className="mt-1 hidden size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary sm:block" weight="bold" />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" weight="bold" />
                {post.user_name ?? t("forum.authorFallback")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarBlank className="size-4" weight="bold" />
                {formatDate(post.created_time)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}

type PostTypeBadgeProps = {
  type: PostType
}

function PostTypeBadge({ type }: PostTypeBadgeProps) {
  const meta = getPostTypeMeta(type)

  return (
    <Badge className={meta.badgeClassName} variant="outline">
      {meta.label}
    </Badge>
  )
}

type SubmissionBadgeProps = {
  end: string | null
}

function SubmissionBadge({ end }: SubmissionBadgeProps) {
  const { t } = useTranslation()
  const active = isPostSubmissionActive(end)

  return (
    <Badge
      className={cn(
        active ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "border-destructive/20 bg-destructive/10 text-destructive",
      )}
      variant="outline"
    >
      {active ? t("forum.submissionStatus.ongoing") : t("forum.submissionStatus.closed")}
    </Badge>
  )
}

type ForumPaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function ForumPagination({ page, totalPages, onPageChange }: ForumPaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-2 text-sm">
      <Pagination className="mx-0 w-auto justify-start">
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
                if (page < totalPages) onPageChange(page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

type ForumStateProps = {
  title: string
  description: string
}

function ForumState({ title, description }: ForumStateProps) {
  return (
    <Card className="p-8 text-center">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  )
}

function ForumListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={index} className="gap-4 p-5">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-muted" />
        </Card>
      ))}
    </div>
  )
}

function parseTypeFilter(value: string | null): PostTypeFilter {
  if (value === "0" || value === "1" || value === "2" || value === "3") {
    return Number(value) as PostType
  }

  return -1
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function resolvePostSearchTitle(post: PostSearchResult) {
  return post.value || i18n.t("common.noTitle")
}

function formatNullableDate(value: string | null) {
  return value ? formatDate(value) : "-"
}

function getPostTypeMeta(type: PostType | unknown) {
  switch (Number(type)) {
    case 0:
      return {
        label: i18n.t("forum.filters.normal"),
        icon: ChatText,
        accentClassName: "bg-muted-foreground/45",
        iconClassName: "bg-muted text-muted-foreground",
        badgeClassName: "border-border bg-muted/60 text-muted-foreground",
      }
    case 1:
      return {
        label: i18n.t("forum.filters.request"),
        icon: Flag,
        accentClassName: "bg-primary",
        iconClassName: "bg-primary/10 text-primary",
        badgeClassName: "border-primary/20 bg-primary/10 text-primary",
      }
    case 2:
      return {
        label: i18n.t("forum.filters.event"),
        icon: CalendarBlank,
        accentClassName: "bg-emerald-500",
        iconClassName: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
        badgeClassName: "border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
      }
    case 3:
      return {
        label: i18n.t("forum.filters.announcement"),
        icon: Megaphone,
        accentClassName: "bg-amber-500",
        iconClassName: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        badgeClassName: "border-amber-500/20 bg-amber-500/15 text-amber-700 dark:text-amber-300",
      }
    default:
      return {
        label: i18n.t("forum.filters.other"),
        icon: ChatText,
        accentClassName: "bg-muted-foreground/45",
        iconClassName: "bg-muted text-muted-foreground",
        badgeClassName: "border-border bg-muted/60 text-muted-foreground",
      }
  }
}


function getPostTypeFilterLabel(type: PostTypeFilter, t: (key: string) => string) {
  switch (type) {
    case -1:
      return t("forum.filters.all")
    case 0:
      return t("forum.filters.normal")
    case 1:
      return t("forum.filters.request")
    case 2:
      return t("forum.filters.event")
    case 3:
      return t("forum.filters.announcement")
  }
}

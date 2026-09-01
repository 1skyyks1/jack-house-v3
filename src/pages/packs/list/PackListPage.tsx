import {
  ArrowClockwise,
  ArrowRight,
  BookmarkSimple,
  CaretDown,
  CheckCircle,
  CrownSimple,
  DownloadSimple,
  FunnelSimple,
  HouseLine,
  MagnifyingGlass,
  Plus,
  Star,
  Tag,
} from "@phosphor-icons/react"
import { useEffect, useRef, useState, type ComponentType, type FormEvent, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"
import osuDirectIcon from "@/assets/pic/osuDirect.svg"
import sayobotIcon from "@/assets/pic/sayobot.ico"
import osuLogoIcon from "@/assets/pic/osu/osuLogo.png"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  getPackCoverUrl,
  getPackDisplayTitle,
  getPackExternalLinks,
  getPackRankStatus,
  getPackTagLabel,
  getPackTypeLabel,
  usePackListInfiniteQuery,
  usePackTagsQuery,
  type GetPackListParams,
  type PackListItem,
  type PackSort,
  type PackTag,
  type PackTypeFilter,
} from "@/entities/pack"
import { getErrorMessage, InlineSkeleton, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"
import { CurationInfoTooltip } from "../CurationInfoTooltip"
import {
  filterTagIdsByType,
  getActiveFilterCount,
  getDefaultFilters,
  getFiltersFromSearchParams,
  getPackFilterTagGroups,
  hasActiveAdvancedFilters,
  packTypeFilters,
  serializeFilters,
  sortFilters,
} from "./utils"

const packDownloadIcons: Record<string, string> = {
  "osu!": osuLogoIcon,
  "osu.direct": osuDirectIcon,
  Sayobot: sayobotIcon,
}

export function PackListPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = getFiltersFromSearchParams(searchParams)
  const packListQuery = usePackListInfiniteQuery(filters)
  const tagsQuery = usePackTagsQuery()
  const packPages = packListQuery.data?.pages ?? []
  const packs = [...new Map(packPages.flatMap((page) => page.data).map((pack) => [pack.pack_id, pack])).values()]
  const packSummary = packPages[0]
  const hasAdvancedFilters = hasActiveAdvancedFilters(filters)
  const [isFilterOpen, setIsFilterOpen] = useState(hasAdvancedFilters)

  const updateFilters = (next: Partial<GetPackListParams>) => {
    setSearchParams(serializeFilters({ ...filters, ...next, page: next.page ?? 1 }))
  }

  const updatePackType = (type: PackTypeFilter) => {
    updateFilters({
      tags: filterTagIdsByType(filters.tags, tagsQuery.data ?? [], type),
      type,
    })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    updateFilters({ searchKeys: String(formData.get("search") ?? "").trim() })
  }

  const toggleTag = (tagId: number) => {
    const nextTags = filters.tags.includes(tagId)
      ? filters.tags.filter((id) => id !== tagId)
      : [...filters.tags, tagId]
    updateFilters({ tags: nextTags })
  }

  const clearFilters = () => {
    setSearchParams(serializeFilters(getDefaultFilters()))
  }

  return (
    <section className="space-y-6">
      <Collapsible onOpenChange={setIsFilterOpen} open={isFilterOpen}>
        <section className="space-y-4">
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={submitSearch}>
            <div className="flex gap-2 md:contents">
              <div className="relative min-w-0 flex-1">
                <Label className="sr-only" htmlFor="packSearch">{t("pack.list.searchLabel")}</Label>
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" weight="bold" />
                <Input
                  className="pl-9"
                  defaultValue={filters.searchKeys}
                  id="packSearch"
                  name="search"
                  placeholder={t("pack.list.searchPlaceholder")}
                />
              </div>
              <Button className="shrink-0" type="submit">
                <MagnifyingGlass className="size-4" weight="bold" />
                {t("pack.list.search")}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 md:contents">
              <CollapsibleTrigger asChild>
                <Button aria-expanded={isFilterOpen} type="button" variant={hasAdvancedFilters ? "default" : "outline"}>
                  <FunnelSimple className="size-4" weight="bold" />
                  {t("pack.list.filters")}
                  {hasAdvancedFilters ? (
                    <Badge className="ml-1 h-5 min-w-5 bg-background/20 px-1.5 text-primary-foreground" variant="secondary">
                      {getActiveFilterCount(filters)}
                    </Badge>
                  ) : null}
                  <CaretDown className={cn("size-4 transition", isFilterOpen && "rotate-180")} weight="bold" />
                </Button>
              </CollapsibleTrigger>
              <Button onClick={clearFilters} type="button" variant="outline">
                <ArrowClockwise className="size-4" weight="bold" />
                {t("pack.list.reset")}
              </Button>
            </div>
            <Button asChild>
              <Link to="/newPack">
                <Plus className="size-4" weight="bold" />
                {t("pack.list.newPack")}
              </Link>
            </Button>
          </form>

          {!isFilterOpen ? (
            <CollapsedQuickFilters
              filters={filters}
              onSelectType={updatePackType}
              onUpdateFilters={updateFilters}
            />
          ) : null}

          <CollapsibleContent>
            <div className="space-y-3 border-t pt-3 sm:space-y-4 sm:pt-4">
              <div className="grid gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-x-6">
                <FilterGroup icon={FunnelSimple} label={t("pack.list.type")}>
                  {packTypeFilters.map((type) => (
                    <FilterButton
                      active={filters.type === type}
                      key={type}
                      onClick={() => updatePackType(type)}
                    >
                      {getPackTypeLabel(type)}
                    </FilterButton>
                  ))}
                </FilterGroup>

                <FilterGroup icon={BookmarkSimple} label={t("pack.list.curation")}>
                  <FilterButton
                    active={Boolean(filters.featured)}
                    highlightTone="featured"
                    onClick={() => updateFilters({ featured: !filters.featured })}
                  >
                    <CrownSimple className="size-3.5" weight="fill" />
                    {t("pack.list.featuredOnly")}
                  </FilterButton>
                  <FilterButton
                    active={Boolean(filters.recommended)}
                    highlightTone="recommended"
                    onClick={() => updateFilters({ recommended: !filters.recommended })}
                  >
                    <Star className="size-3.5" weight="fill" />
                    {t("pack.list.recommendedOnly")}
                  </FilterButton>
                  <FilterButton
                    active={Boolean(filters.original)}
                    highlightTone="original"
                    onClick={() => updateFilters({ original: !filters.original })}
                  >
                    <HouseLine className="size-3.5" weight="fill" />
                    {t("pack.list.originalOnly")}
                  </FilterButton>
                  <CurationInfoTooltip />
                </FilterGroup>

                <FilterGroup icon={CheckCircle} label={t("pack.list.status")}>
                  <FilterButton
                    active={Boolean(filters.graveyard)}
                    onClick={() => updateFilters({ graveyard: !filters.graveyard })}
                  >
                    {t("pack.rankStatus.graveyard")}
                  </FilterButton>
                  <FilterButton
                    active={Boolean(filters.ranked)}
                    highlightTone="ranked"
                    onClick={() => updateFilters({ ranked: !filters.ranked })}
                  >
                    {t("pack.rankStatus.ranked")}
                  </FilterButton>
                  <FilterButton
                    active={Boolean(filters.loved)}
                    highlightTone="loved"
                    onClick={() => updateFilters({ loved: !filters.loved })}
                  >
                    {t("pack.rankStatus.loved")}
                  </FilterButton>
                </FilterGroup>

                <FilterGroup icon={ArrowRight} label={t("pack.list.sort")}>
                  {sortFilters.map((sort) => (
                    <FilterButton
                      active={filters.sort === sort}
                      key={sort}
                      onClick={() => updateFilters({ sort })}
                    >
                      {getSortLabel(sort, t)}
                    </FilterButton>
                  ))}
                </FilterGroup>
              </div>

              <TagFilterGroup
                isError={tagsQuery.isError}
                isLoading={tagsQuery.isLoading}
                onToggleTag={toggleTag}
                packType={filters.type}
                selectedTags={filters.tags}
                tags={tagsQuery.data ?? []}
              />
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>

      <section className="space-y-4">
        {packListQuery.isLoading ? (
          <PackGridSkeleton />
        ) : packListQuery.isError && !packListQuery.data ? (
          <PackState title={t("pack.list.loadFailedTitle")} description={getErrorMessage(packListQuery.error)} />
        ) : packSummary && packs.length > 0 ? (
          <>
            {isFilterOpen ? (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("pack.list.totalPacks", { count: packSummary.total })}</span>
              </div>
            ) : null}
              <div className="grid gap-x-3 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              {packs.map((pack) => (
                <PackCard key={pack.pack_id} pack={pack} />
              ))}
            </div>
            <PackListLoadMore
              error={packListQuery.isFetchNextPageError ? packListQuery.error : null}
              hasMore={Boolean(packListQuery.hasNextPage)}
              isLoading={packListQuery.isFetchingNextPage}
              onLoadMore={() => void packListQuery.fetchNextPage()}
              showEnd={packSummary.totalPages > 1}
            />
          </>
        ) : (
          <PackState description={t("pack.list.noResultsDescription")} title={t("pack.list.noResultsTitle")} />
        )}
      </section>
    </section>
  )
}

type FilterGroupProps = {
  children: ReactNode
  icon: ComponentType<{ className?: string; weight?: "bold" }>
  label: string
}

function FilterGroup({ children, icon: Icon, label }: FilterGroupProps) {
  return (
    <div className="grid grid-cols-[minmax(3.25rem,max-content)_minmax(0,1fr)] items-center gap-1.5 sm:grid-cols-1 sm:gap-2 lg:grid-cols-[5.5rem_minmax(0,1fr)]">
      <div className="flex h-7 items-center gap-2 whitespace-nowrap text-xs font-semibold text-muted-foreground sm:h-8 sm:text-sm">
        <Icon className="hidden size-4 sm:block" weight="bold" />
        {label}
      </div>
      <div className="flex min-w-0 flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2 sm:overflow-visible">{children}</div>
    </div>
  )
}

type CollapsedQuickFiltersProps = {
  filters: GetPackListParams
  onSelectType: (type: PackTypeFilter) => void
  onUpdateFilters: (filters: Partial<GetPackListParams>) => void
}

function CollapsedQuickFilters({ filters, onSelectType, onUpdateFilters }: CollapsedQuickFiltersProps) {
  const { t } = useTranslation()

  return (
    <div className="hidden items-center gap-4 lg:flex">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="mr-1 shrink-0 text-xs font-semibold text-muted-foreground">{t("pack.list.type")}</span>
        {packTypeFilters.map((type) => (
          <FilterButton
            active={filters.type === type}
            compact
            key={type}
            onClick={() => onSelectType(type)}
          >
            {getPackTypeLabel(type)}
          </FilterButton>
        ))}
      </div>
      <div aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="mr-1 shrink-0 text-xs font-semibold text-muted-foreground">{t("pack.list.curation")}</span>
        <FilterButton
          active={Boolean(filters.featured)}
          compact
          highlightTone="featured"
          onClick={() => onUpdateFilters({ featured: !filters.featured })}
        >
          <CrownSimple className="size-3.5" weight="fill" />
          {t("pack.list.featuredOnly")}
        </FilterButton>
        <FilterButton
          active={Boolean(filters.recommended)}
          compact
          highlightTone="recommended"
          onClick={() => onUpdateFilters({ recommended: !filters.recommended })}
        >
          <Star className="size-3.5" weight="fill" />
          {t("pack.list.recommendedOnly")}
        </FilterButton>
        <FilterButton
          active={Boolean(filters.original)}
          compact
          highlightTone="original"
          onClick={() => onUpdateFilters({ original: !filters.original })}
        >
          <HouseLine className="size-3.5" weight="fill" />
          {t("pack.list.originalOnly")}
        </FilterButton>
        <CurationInfoTooltip />
      </div>
    </div>
  )
}

type FilterButtonProps = {
  active: boolean
  children: ReactNode
  compact?: boolean
  highlightTone?: "featured" | "loved" | "original" | "ranked" | "recommended"
  onClick: () => void
}

const filterHighlightClasses = {
  featured: {
    active: "border-amber-500 bg-amber-500 font-semibold text-amber-950 shadow-sm shadow-amber-500/20 hover:bg-amber-600",
    inactive: "border-amber-500/35 bg-amber-500/5 font-semibold text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200",
  },
  original: {
    active: "border-sky-600 bg-sky-600 font-semibold text-white shadow-sm shadow-sky-500/20 hover:bg-sky-700",
    inactive: "border-sky-500/35 bg-sky-500/5 font-semibold text-sky-700 hover:bg-sky-500/10 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200",
  },
  recommended: {
    active: "border-violet-600 bg-violet-600 font-semibold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700",
    inactive: "border-violet-500/35 bg-violet-500/5 font-semibold text-violet-700 hover:bg-violet-500/10 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200",
  },
  ranked: {
    active: "border-emerald-600 bg-emerald-600 font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700",
    inactive: "border-emerald-500/35 bg-emerald-500/5 font-semibold text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
  },
  loved: {
    active: "border-pink-600 bg-pink-600 font-semibold text-white shadow-sm shadow-pink-500/20 hover:bg-pink-700",
    inactive: "border-pink-500/35 bg-pink-500/5 font-semibold text-pink-700 hover:bg-pink-500/10 hover:text-pink-800 dark:text-pink-300 dark:hover:text-pink-200",
  },
} as const

function FilterButton({ active, children, compact = false, highlightTone, onClick }: FilterButtonProps) {
  const highlightClass = highlightTone ? filterHighlightClasses[highlightTone][active ? "active" : "inactive"] : null
  return (
    <Button
      className={cn(
        "shrink-0 border",
        compact
          ? "h-7 gap-1.5 px-2 text-xs"
          : "h-7 gap-1.5 px-2 text-xs sm:h-8 sm:gap-2 sm:px-3 sm:text-sm",
        !active && !highlightTone && "border-input bg-background text-muted-foreground",
        highlightClass,
      )}
      onClick={onClick}
      type="button"
      variant={active ? "default" : "outline"}
    >
      {children}
    </Button>
  )
}

type TagFilterGroupProps = {
  isError: boolean
  isLoading: boolean
  onToggleTag: (tagId: number) => void
  packType: PackTypeFilter
  selectedTags: number[]
  tags: PackTag[]
}

function TagFilterGroup({ isError, isLoading, onToggleTag, packType, selectedTags, tags }: TagFilterGroupProps) {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <FilterGroup icon={Tag} label={t("pack.list.tags")}>
        <InlineSkeleton count={5} />
      </FilterGroup>
    )
  }

  if (isError) {
    return (
      <FilterGroup icon={Tag} label={t("pack.list.tags")}>
        <span className="text-sm text-muted-foreground">{t("pack.list.tagsUnavailable")}</span>
      </FilterGroup>
    )
  }

  if (tags.length === 0) return null
  const groups = getPackFilterTagGroups(tags, packType)

  if (groups.length === 0) {
    return (
      <FilterGroup icon={Tag} label={t("pack.list.tags")}>
        <span className="text-sm text-muted-foreground">{t("pack.list.tagsNotUsed")}</span>
      </FilterGroup>
    )
  }

  return (
    <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-[5.5rem_minmax(0,1fr)] lg:items-start">
      <div className="hidden h-8 items-center gap-2 text-sm font-semibold text-muted-foreground sm:flex">
        <Tag className="hidden size-4 sm:block" weight="bold" />
        {t("pack.list.tags")}
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        {groups.map((group) => (
          <div className="grid grid-cols-[minmax(3rem,max-content)_minmax(0,1fr)] items-center gap-1 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-2" key={group.label}>
            <div className="flex h-7 items-center whitespace-nowrap text-xs font-semibold uppercase text-muted-foreground sm:h-8">{group.label}</div>
            <div className="flex min-w-0 flex-nowrap gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2 sm:overflow-visible">
              {group.tags.map((tag) => (
                <FilterButton
                  active={selectedTags.includes(tag.tag_id)}
                  key={tag.tag_id}
                  onClick={() => onToggleTag(tag.tag_id)}
                >
                  {getPackTagLabel(tag)}
                </FilterButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

type PackCardProps = {
  pack: PackListItem
}

function PackCard({ pack }: PackCardProps) {
  const { t } = useTranslation()
  const coverUrl = getPackCoverUrl(pack)
  const status = getPackRankStatus(pack.status)
  const externalLinks = getPackExternalLinks(pack.osu_bid)
  const displayedLinks = [
    ...externalLinks,
    ...(pack.other_url ? [{ label: "Other", url: pack.other_url }] : []),
  ]

  return (
    <Card
      size="sm"
      className="group relative h-36 overflow-hidden py-0"
    >
      <Link className="relative block h-full overflow-hidden rounded-[inherit] text-white" to={`/pack/${pack.pack_id}`}>
        {coverUrl ? (
          <img alt="" className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]" src={coverUrl} />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.78))]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-2 transition duration-200 group-hover:-translate-y-2 group-hover:opacity-0">
            <Badge variant="outline" className="border-white/20 bg-black/35 text-white">
              {getPackTypeLabel(pack.type)}
            </Badge>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          </div>
          <div className="min-w-0 pr-4">
            {pack.leaderboard_enabled || pack.is_recommended ? (
              <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold tracking-[0.14em] drop-shadow-sm">
                {pack.leaderboard_enabled ? (
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <CrownSimple aria-hidden="true" className="size-4" weight="fill" />
                    {t("pack.featured")}
                  </span>
                ) : null}
                {pack.is_recommended ? (
                  <span className="inline-flex items-center gap-1 text-violet-300">
                    <Star aria-hidden="true" className="size-3.5" weight="fill" />
                    {t("pack.recommended")}
                  </span>
                ) : null}
              </div>
            ) : null}
            <h2 className="truncate font-heading text-base font-semibold leading-tight">
              {getPackDisplayTitle(pack)}
            </h2>
            <p className="mt-1 truncate text-xs text-white/76">{t("pack.list.mappedBy", { name: pack.creator })}</p>
          </div>
        </div>
      </Link>

      {displayedLinks.length > 0 ? (
        <div className="absolute inset-x-3 top-3 z-20 flex -translate-y-12 justify-end gap-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          {displayedLinks.slice(0, 4).map((link) => (
            <TooltipProvider key={link.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    aria-label={link.label}
                    className="border-white/20 bg-black/45 text-white shadow-sm hover:bg-black/60"
                    size="icon-sm"
                    variant="outline"
                  >
                    <a href={link.url} rel="noopener noreferrer" target="_blank" title={link.label}>
                      <PackDownloadIcon label={link.label} />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{link.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

function PackDownloadIcon({ label }: { label: string }) {
  const icon = packDownloadIcons[label]

  if (icon) {
    return <img alt="" className="size-4 shrink-0 object-contain" src={icon} />
  }

  return <DownloadSimple className="size-3.5 shrink-0" weight="bold" />
}

type StatusBadgeProps = {
  children: string
  tone: "danger" | "muted" | "success" | "warning"
}

function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "shrink-0 border-white/16",
        tone === "muted" && "bg-black/35 text-white/78",
        tone === "success" && "bg-emerald-700/55 text-emerald-50",
        tone === "warning" && "bg-amber-700/55 text-amber-50",
        tone === "danger" && "bg-rose-700/55 text-rose-50",
      )}
      variant="outline"
    >
      {children}
    </Badge>
  )
}

type PackListLoadMoreProps = {
  error: Error | null
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  showEnd: boolean
}

function PackListLoadMore({ error, hasMore, isLoading, onLoadMore, showEnd }: PackListLoadMoreProps) {
  const { t } = useTranslation()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading || error) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onLoadMore()
    }, { rootMargin: "40px 0px" })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [error, hasMore, isLoading, onLoadMore])

  return (
    <div ref={sentinelRef} aria-live="polite" className="grid min-h-10 place-items-center" role="status">
      {error ? (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-destructive">
          <span>{t("pack.list.loadMoreFailed")}</span>
          <Button onClick={onLoadMore} size="sm" type="button" variant="outline">
            {t("pack.list.retryLoad")}
          </Button>
        </div>
      ) : isLoading ? (
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowClockwise className="size-4 animate-spin" weight="bold" />
          {t("pack.list.loadingMore")}
        </span>
      ) : !hasMore && showEnd ? (
        <span className="text-sm text-muted-foreground">{t("pack.list.allLoaded")}</span>
      ) : null}
    </div>
  )
}

function getSortLabel(sort: PackSort, t: ReturnType<typeof useTranslation>["t"]) {
  switch (sort) {
    case 0:
      return t("pack.list.sortOptions.newest")
    case 1:
      return t("pack.list.sortOptions.oldestSubmitted")
    case 2:
      return t("pack.list.sortOptions.newestSubmitted")
  }
}

type PackStateProps = {
  description: string
  title: string
}

function PackState({ description, title }: PackStateProps) {
  return <PageState className="py-12 sm:py-14" description={description} headingLevel="h2" title={title} />
}

function PackGridSkeleton() {
  return (
      <div className="grid gap-x-3 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Card className="overflow-hidden py-0" key={index}>
          <div className="h-28 animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-8 w-full animate-pulse rounded bg-muted" />
          </div>
        </Card>
      ))}
    </div>
  )
}

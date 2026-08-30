import { getVisiblePackTagGroups, type GetPackListParams, type PackSort, type PackTag, type PackTypeFilter } from "@/entities/pack"

export const PACK_LIST_PAGE_SIZE = 12
export const packTypeFilters: PackTypeFilter[] = [-1, 0, 1, 2, 3]
export const sortFilters: PackSort[] = [0, 1, 2]

export type PackFilterTagGroup = {
  label: string
  tags: PackTag[]
}

export function getFiltersFromSearchParams(searchParams: URLSearchParams): GetPackListParams {
  return {
    featured: searchParams.get("featured") === "1",
    graveyard: searchParams.get("graveyard") === "1",
    loved: searchParams.get("loved") === "1",
    original: searchParams.get("original") === "1",
    page: parsePositiveInteger(searchParams.get("page"), 1),
    pageSize: PACK_LIST_PAGE_SIZE,
    ranked: searchParams.get("ranked") === "1",
    recommended: searchParams.get("recommended") === "1",
    searchKeys: searchParams.get("q") ?? "",
    sort: parseSort(searchParams.get("sort")),
    tags: parseNumberList(searchParams.get("tags")),
    type: parsePackType(searchParams.get("type")),
  }
}

export function getDefaultFilters(): GetPackListParams {
  return {
    featured: false,
    graveyard: false,
    loved: false,
    original: false,
    page: 1,
    pageSize: PACK_LIST_PAGE_SIZE,
    ranked: false,
    recommended: false,
    searchKeys: "",
    sort: 0,
    tags: [],
    type: -1,
  }
}

export function serializeFilters(filters: GetPackListParams) {
  const params = new URLSearchParams()

  if (filters.page > 1) params.set("page", String(filters.page))
  if (filters.searchKeys) params.set("q", filters.searchKeys)
  if (filters.type !== -1) params.set("type", String(filters.type))
  if (filters.graveyard) params.set("graveyard", "1")
  if (filters.ranked) params.set("ranked", "1")
  if (filters.featured) params.set("featured", "1")
  if (filters.recommended) params.set("recommended", "1")
  if (filters.loved) params.set("loved", "1")
  if (filters.original) params.set("original", "1")
  if (filters.sort !== 0) params.set("sort", String(filters.sort))
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","))

  return params
}

export function hasActiveAdvancedFilters(filters: GetPackListParams) {
  return filters.type !== -1 || Boolean(filters.featured) || Boolean(filters.graveyard) || Boolean(filters.ranked) || Boolean(filters.loved) || Boolean(filters.original) || Boolean(filters.recommended) || filters.sort !== 0 || filters.tags.length > 0
}

export function getActiveFilterCount(filters: GetPackListParams) {
  let count = 0
  if (filters.type !== -1) count += 1
  if (filters.graveyard) count += 1
  if (filters.ranked) count += 1
  if (filters.featured) count += 1
  if (filters.loved) count += 1
  if (filters.recommended) count += 1
  if (filters.original) count += 1
  if (filters.sort !== 0) count += 1
  count += filters.tags.length
  return count
}

export function getPackFilterTagGroups(tags: PackTag[], packType: PackTypeFilter): PackFilterTagGroup[] {
  return getVisiblePackTagGroups(tags, packType)
}

export function filterTagIdsByType(tagIds: number[], tags: PackTag[], packType: PackTypeFilter) {
  if (packType === -1 || tags.length === 0) return tagIds

  const visibleTagIds = new Set(getPackFilterTagGroups(tags, packType).flatMap((group) => group.tags.map((tag) => tag.tag_id)))
  return tagIds.filter((tagId) => visibleTagIds.has(tagId))
}

function parsePositiveInteger(value: string | null, fallback: number) {
  const numberValue = Number(value)
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : fallback
}

function parsePackType(value: string | null): PackTypeFilter {
  if (value === "0" || value === "1" || value === "2" || value === "3") {
    return Number(value) as PackTypeFilter
  }

  return -1
}

function parseSort(value: string | null): PackSort {
  if (value === "1" || value === "2") {
    return Number(value) as PackSort
  }

  return 0
}

function parseNumberList(value: string | null) {
  if (!value) return []

  return value
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0)
}

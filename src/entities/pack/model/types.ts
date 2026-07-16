import { i18n } from "@/shared/i18n/client"

export type PackType = 0 | 1 | 2 | 3
export type PackTypeFilter = PackType | -1
export type PackRankStatus = -2 | -1 | 0 | 1 | 2 | 3 | 4
export type PackSort = 0 | 1 | 2

export type PackTag = {
  tag_id: number
  tag_name: string
}

export type PackUser = {
  user_id: number
  user_name: string
}

export type PackMap = {
  beatmap_id: number | null
  bpm: number | string
  created_time: string
  hp: number | string
  key_count: number
  length: number
  ln_count: number
  map_id: number
  od: number | string
  pack_id: number
  rating: number | string
  real_length: number
  updated_time: string
  version: string
}

export type PackListItem = {
  pack_id: number
  artist: string | null
  artist_unicode: string | null
  title: string
  title_unicode: string | null
  creator: string
  osu_bid: number | null
  other_url: string | null
  type: PackType
  status: PackRankStatus | null
  last_updated: string | null
  submitted_date: string | null
  cover_id: number | null
  created_time: string
  updated_time: string
  tags?: PackTag[]
  user?: PackUser
}

export type PackDetail = PackListItem & {
  description: string | null
  maps?: PackMap[]
  user?: PackUser & {
    avatar?: string | null
  }
}

export type GetPackListParams = {
  loved?: boolean
  page: number
  pageSize: number
  ranked?: boolean
  searchKeys?: string
  sort: PackSort
  tags: number[]
  type: PackTypeFilter
}

export type OsuPackPreview = {
  artist: string
  cover: string
  creator: string
  title: string
}

export type CreatePackRequest = {
  creator: string
  tags: number[]
  title: string
  type: PackType
  url?: string
}

export type CreatePackResponse = {
  pack_id: number
}

export type ImportOsuPackRequest = {
  beatmapsetId: string
  tags: number[]
  type: PackType
}

export type UpdatePackTagsRequest = {
  packId: number | string
  tags: number[]
}

export type RefreshOsuPackRequest = {
  beatmapsetId: number | string
  packId: number | string
}

export type PackTagGroup = {
  label: string
  tags: PackTag[]
}

export function getPackDisplayTitle(pack: Pick<PackListItem, "artist" | "artist_unicode" | "title" | "title_unicode" | "type">) {
  const title = pack.title_unicode || pack.title
  const artist = pack.artist_unicode || pack.artist

  if (pack.type === 3 && artist) {
    return `${artist} - ${title}`
  }

  return title
}

export function getPackCoverUrl(pack: Pick<PackListItem, "osu_bid">) {
  if (!pack.osu_bid) return null
  return `https://assets.ppy.sh/beatmaps/${pack.osu_bid}/covers/card@2x.jpg`
}

export function getPackTypeLabel(type: PackTypeFilter) {
  switch (type) {
    case -1:
      return i18n.t("pack.type.all")
    case 0:
      return i18n.t("pack.type.practice")
    case 1:
      return i18n.t("pack.type.collection")
    case 2:
      return i18n.t("pack.type.dan")
    case 3:
      return i18n.t("pack.type.single")
  }
}

export function getPackRankStatus(status: PackRankStatus | null) {
  switch (status) {
    case -2:
      return { label: i18n.t("pack.rankStatus.graveyard"), tone: "muted" as const }
    case -1:
      return { label: i18n.t("pack.rankStatus.wip"), tone: "warning" as const }
    case 0:
      return { label: i18n.t("pack.rankStatus.pending"), tone: "danger" as const }
    case 1:
      return { label: i18n.t("pack.rankStatus.ranked"), tone: "success" as const }
    case 2:
      return { label: i18n.t("pack.rankStatus.approved"), tone: "success" as const }
    case 3:
      return { label: i18n.t("pack.rankStatus.qualified"), tone: "success" as const }
    case 4:
      return { label: i18n.t("pack.rankStatus.loved"), tone: "danger" as const }
    default:
      return { label: i18n.t("pack.rankStatus.unknown"), tone: "muted" as const }
  }
}

const packTagLabels: Record<number, { en: string; zh: string }> = {
  1: { en: "Full Jack", zh: "满叠" },
  2: { en: "Dense Jack", zh: "大叠" },
  3: { en: "Middle Jack", zh: "中叠" },
  4: { en: "Light Jack", zh: "小叠" },
  5: { en: "Anchor Jack", zh: "纵叠" },
  6: { en: "QuadStream", zh: "四押切" },
  7: { en: "MiniJack", zh: "子弹叠" },
}

export function getPackTagLabel(tag: Pick<PackTag, "tag_id" | "tag_name">) {
  const label = packTagLabels[tag.tag_id]
  if (!label) return tag.tag_name
  return i18n.language === "en" ? label.en : label.zh
}

export function getPackExternalLinks(osuBid: number | null) {
  if (!osuBid) return []

  return [
    { label: "osu!", url: `https://osu.ppy.sh/beatmapsets/${osuBid}` },
    { label: "osu.direct", url: `https://osu.direct/api/d/${osuBid}` },
    { label: "Sayobot", url: `https://txy1.sayobot.cn/beatmaps/download/full/${osuBid}` },
    { label: "NeriNyan", url: `https://dl.nerinyan.moe/d/${osuBid}` },
  ]
}

export function getDifficultyColor(value: number | string | null | undefined) {
  const difficulty = toFiniteNumber(value, 0)
  if (difficulty < 0.1) return "#AAAAAA"
  if (difficulty >= 9) return "#000000"

  const segments = [
    { value: 0.1, color: "#4290FB" },
    { value: 1.25, color: "#4FC0FF" },
    { value: 2, color: "#4FFFD5" },
    { value: 2.5, color: "#7CFF4F" },
    { value: 3.3, color: "#F6F05C" },
    { value: 4.2, color: "#FF8068" },
    { value: 4.9, color: "#FF4E6F" },
    { value: 5.8, color: "#C645B8" },
    { value: 6.7, color: "#6563DE" },
    { value: 7.7, color: "#18158E" },
    { value: 9, color: "#000000" },
  ]

  for (let index = 0; index < segments.length - 1; index += 1) {
    const start = segments[index]
    const end = segments[index + 1]

    if (difficulty >= start.value && difficulty <= end.value) {
      const progress = (difficulty - start.value) / (end.value - start.value)
      return interpolateGammaHexColor(start.color, end.color, progress)
    }
  }

  return segments[segments.length - 1].color
}

export function getDifficultyTextColor(value: number | string | null | undefined) {
  const difficulty = toFiniteNumber(value, 0)
  if (difficulty < 6.5) return "#000000"
  if (difficulty < 9) return "#F6F05C"

  const segments = [
    { value: 9, color: "#F6F05C" },
    { value: 9.9, color: "#FF8068" },
    { value: 10.6, color: "#FF4E6F" },
    { value: 11.5, color: "#C645B8" },
    { value: 12.4, color: "#6563DE" },
  ]

  for (let index = 0; index < segments.length - 1; index += 1) {
    const start = segments[index]
    const end = segments[index + 1]

    if (difficulty >= start.value && difficulty <= end.value) {
      const progress = (difficulty - start.value) / (end.value - start.value)
      return interpolateGammaHexColor(start.color, end.color, progress)
    }
  }

  return segments[segments.length - 1].color
}

export function toFiniteNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

export function getVisiblePackTagGroups(tags: PackTag[], packType: PackType): PackTagGroup[] {
  const groups = [
    { label: i18n.t("pack.tagGroups.pattern"), tags: tags.slice(0, 7) },
    { label: i18n.t("pack.tagGroups.bpm"), tags: tags.slice(7, 19) },
    { label: i18n.t("pack.tagGroups.difficulty"), tags: tags.slice(19) },
  ]

  if (packType === 0) return groups.filter((group) => group.tags.length > 0)
  if (packType === 2) return groups.filter((group) => group.label === i18n.t("pack.tagGroups.difficulty") && group.tags.length > 0)
  if (packType === 3) return groups.filter((group) => group.label === i18n.t("pack.tagGroups.pattern") && group.tags.length > 0)
  return []
}

export function filterPackTagIdsForType(tagIds: number[], tags: PackTag[], packType: PackType) {
  const visibleTagIds = new Set(getVisiblePackTagGroups(tags, packType).flatMap((group) => group.tags.map((tag) => tag.tag_id)))
  return tagIds.filter((tagId) => visibleTagIds.has(tagId))
}

function interpolateGammaHexColor(startHex: string, endHex: string, progress: number) {
  const gamma = 2.2
  const start = hexToRgb(startHex)
  const end = hexToRgb(endHex)
  const rgb = start.map((channel, index) => {
    const startChannel = channel ** gamma
    const endChannel = end[index] ** gamma
    return Math.round((startChannel + (endChannel - startChannel) * progress) ** (1 / gamma))
  })
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase()
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ]
}

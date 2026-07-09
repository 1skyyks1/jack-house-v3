import type { TournamentMappoolMap } from "@/entities/tournament"

export const MAIN_STAGE_MAP_TYPE_ORDER = ["FU", "DS", "MD", "LT", "AC", "QS", "MN", "RM", "MX", "DF", "TB"] as const

const MAIN_STAGE_MAP_TYPE_INDEX = new Map<string, number>(MAIN_STAGE_MAP_TYPE_ORDER.map((type, index) => [type, index]))

type MappoolLike = Pick<TournamentMappoolMap, "id" | "type"> & {
  created_time?: string | null
}

export function normalizeMapType(type: string | null | undefined) {
  return String(type || "").trim().toUpperCase()
}

export function compareMappoolMaps(a: MappoolLike, b: MappoolLike) {
  const aType = normalizeMapType(a.type)
  const bType = normalizeMapType(b.type)
  const aTypeIndex = MAIN_STAGE_MAP_TYPE_INDEX.get(aType) ?? MAIN_STAGE_MAP_TYPE_ORDER.length
  const bTypeIndex = MAIN_STAGE_MAP_TYPE_INDEX.get(bType) ?? MAIN_STAGE_MAP_TYPE_ORDER.length
  if (aTypeIndex !== bTypeIndex) return aTypeIndex - bTypeIndex
  if (aType !== bType) return aType.localeCompare(bType)

  const aTime = a.created_time ? Date.parse(a.created_time) : Number.NaN
  const bTime = b.created_time ? Date.parse(b.created_time) : Number.NaN
  if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return aTime - bTime
  if (Number.isFinite(aTime) !== Number.isFinite(bTime)) return Number.isFinite(aTime) ? -1 : 1

  return a.id - b.id
}

export function sortMappoolMaps<T extends MappoolLike>(maps: T[]) {
  return [...maps].sort(compareMappoolMaps)
}

export function buildMappoolLabelMap<T extends MappoolLike>(maps: T[]) {
  const sortedMaps = sortMappoolMaps(maps)
  const countByType = new Map<string, number>()
  for (const map of sortedMaps) {
    const type = normalizeMapType(map.type)
    countByType.set(type, (countByType.get(type) ?? 0) + 1)
  }

  const seenByType = new Map<string, number>()
  const labelById = new Map<number, string>()
  for (const map of sortedMaps) {
    const type = normalizeMapType(map.type)
    const nextIndex = (seenByType.get(type) ?? 0) + 1
    seenByType.set(type, nextIndex)
    labelById.set(map.id, (countByType.get(type) ?? 0) > 1 ? `${type}${nextIndex}` : type)
  }
  return labelById
}

export function getMappoolLabel(map: MappoolLike | null | undefined, labelById?: Map<number, string>) {
  if (!map) return ""
  return labelById?.get(map.id) ?? normalizeMapType(map.type)
}

export function labelMappoolMaps<T extends MappoolLike>(maps: T[]) {
  const sortedMaps = sortMappoolMaps(maps)
  const labelById = buildMappoolLabelMap(sortedMaps)
  return sortedMaps.map((map) => ({ label: getMappoolLabel(map, labelById), map }))
}

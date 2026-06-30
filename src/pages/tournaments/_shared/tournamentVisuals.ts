import type { Tournament, TournamentMappoolMap, TournamentQualMap } from "@/entities/tournament"

type TournamentVisualMap = Pick<TournamentQualMap | TournamentMappoolMap, "map_id"> & {
  set_id?: number | null
}

export function getTournamentPublicPath(tournament?: Pick<Tournament, "acronym" | "id"> | null) {
  if (!tournament) return "/t"
  return `/t/${tournament.acronym || tournament.id}`
}

export function getOsuBeatmapsetCoverUrl(setId?: number | null, size: "card" | "cover" = "card") {
  if (!setId) return null
  return `https://assets.ppy.sh/beatmaps/${setId}/covers/${size}@2x.jpg`
}

export function getTournamentMapCoverUrl(map?: TournamentVisualMap | null, size: "card" | "cover" = "card") {
  return getOsuBeatmapsetCoverUrl(map?.set_id, size)
}

export function getTournamentHeroImage(tournament?: Pick<Tournament, "banner"> | null, maps: TournamentVisualMap[] = []) {
  return tournament?.banner || getTournamentMapCoverUrl(maps.find((map) => map.set_id), "cover")
}

export type RoundFormState = {
  bracket_type: string
  first_to: string
  name: string
  order: string
}

export type MapFormState = {
  artist: string
  map_id: string
  mapper: string
  title: string
  type: string
}

export type MatchFormState = {
  is_possible: string
  round_id: string
  scheduled_time: string
  team1_id: string
  team2_id: string
}

export type MatchUpdateState = {
  mp_id: string
  result_note: string
  result_type: "normal" | "wbd" | "ff"
  status: string
  team1_score: string
  team2_score: string
  winner_id: string
}

export const MAIN_STAGE_MAP_TYPES = ["FU", "DS", "MD", "LT", "AC", "QS", "MN", "RM", "MX", "DF", "TB"] as const

export const defaultRoundForm: RoundFormState = {
  bracket_type: "0",
  first_to: "5",
  name: "",
  order: "",
}

export const defaultMapForm: MapFormState = {
  artist: "",
  map_id: "",
  mapper: "",
  title: "",
  type: MAIN_STAGE_MAP_TYPES[0],
}

export const defaultMatchForm: MatchFormState = {
  is_possible: "0",
  round_id: "",
  scheduled_time: "",
  team1_id: "none",
  team2_id: "none",
}

export const QUAL_RANK_MODE_TOTAL_SCORE = 0
export const QUAL_RANK_MODE_RANK_SUM = 1

export type TournamentUser = {
  avatar?: string | null
  osu_uid?: number | null
  user_id: number
  user_name: string
}

export const TOURNAMENT_STAFF_ROLES = ["host", "pooler", "custom_mapper", "tester", "referee", "streamer", "commentator"] as const
export type TournamentStaffRole = typeof TOURNAMENT_STAFF_ROLES[number]

export type TournamentStaff = {
  id: number
  role: TournamentStaffRole | string
  user?: TournamentUser
  user_id: number
}

export function isPlayerCompatibleTournamentStaffRole(role: string) {
  return role === "tester" || role === "streamer" || role === "commentator"
}

export type CreateTournamentStaffRequest = {
  avatar?: string | null
  osu_uid?: number | string | null
  role: TournamentStaffRole
  user_id?: number
  user_name?: string
}

export type TournamentRound = {
  bracket_type: number
  first_to: number
  id: number
  mappool?: TournamentMappoolMap[]
  name: string
  order?: number | null
  start_time?: string | null
  end_time?: string | null
}

export type Tournament = {
  acronym: string
  banner?: string | null
  created_by?: number | null
  created_time?: string
  default_team_avatar?: string | null
  desc_en?: string | null
  desc_zh?: string | null
  id: number
  name: string
  qual_end?: string | null
  qual_locked_at?: string | null
  qual_locked_by?: number | null
  qual_locked_top_n?: number | null
  qual_rank_mode?: number
  qual_start?: string | null
  qual_top_n?: number
  reg_end?: string | null
  reg_start?: string | null
  rounds?: TournamentRound[]
  staff?: TournamentStaff[]
  status?: number
  team_size_max?: number
  team_size_min?: number
  updated_time?: string
}

export type CreateTournamentRequest = {
  acronym: string
  banner?: string | null
  desc_en?: string | null
  desc_zh?: string | null
  name: string
  qual_end?: string | null
  qual_rank_mode?: number
  qual_start?: string | null
  qual_top_n?: number
  reg_end: string
  reg_start: string
  team_size_max?: number
  team_size_min?: number
}

export type UpdateTournamentRequest = Partial<CreateTournamentRequest> & {
  status?: number
}

export type TournamentTeam = {
  avatar?: string | null
  captain?: TournamentUser
  captain_id?: number
  captain_player_id?: number | null
  display_name: string
  id: number
  invite_code?: string | null
  is_open?: number | boolean
  locked_at?: string | null
  name: string
  players?: TournamentPlayer[]
  qual_rank?: number | null
  qual_score?: number | null
  status?: number
  updated_time?: string
}

export type TournamentPlayer = {
  avatar_snapshot?: string | null
  contact_discord?: string | null
  contact_qq?: string | null
  id: number
  is_captain?: number
  remark?: string | null
  review_status?: "review_pending" | "review_passed" | "review_failed" | string
  team_id: number
  timezone?: string | null
  user?: TournamentUser & { osu_uid?: number | null }
  user_id: number
  user_name_snapshot?: string | null
}

export type UpdateTournamentTeamStatusRequest = {
  status: number
}

export type UpdateTournamentPlayerRequest = {
  avatar_snapshot?: string | null
  contact_discord?: string | null
  contact_qq?: string | null
  remark?: string | null
  review_status?: "review_pending" | "review_passed" | "review_failed"
  timezone?: string | null
  user_name_snapshot?: string | null
}

export type TournamentMatch = {
  bracket_group?: "winner" | "loser" | "grand_final" | "reset_final" | string | null
  games?: TournamentGame[]
  hidden_until_match_id?: number | null
  id: number
  is_possible?: number
  mp_id?: number | null
  result_note?: string | null
  result_type?: "normal" | "wbd" | "ff" | string
  roll_winner_id?: number | null
  round?: TournamentRound
  round_id: number
  round_no?: number | null
  scheduled_time?: string | null
  slot_no?: number | null
  source_match_1_id?: number | null
  source_match_1_result?: "winner" | "loser" | string | null
  source_match_2_id?: number | null
  source_match_2_result?: "winner" | "loser" | string | null
  status: number
  team1?: TournamentTeam | null
  team1_id?: number | null
  team1_score: number
  team1_timeout_used?: number
  team2?: TournamentTeam | null
  team2_id?: number | null
  team2_score: number
  team2_timeout_used?: number
  winner?: TournamentTeam | null
  winner_id?: number | null
  winner_overridden?: number | boolean
}

export type TournamentMappoolMap = {
  artist: string
  created_time?: string
  id: number
  map_id: number
  mapper: string
  round_id?: number
  set_id?: number | null
  title: string
  type: string
}

export type CreateTournamentRoundRequest = {
  bracket_type: number
  end_time?: string | null
  first_to: number
  name: string
  order?: number | null
  start_time?: string | null
}

export type UpdateTournamentRoundRequest = Partial<CreateTournamentRoundRequest>

export type CreateTournamentRoundMapRequest = {
  beatmap_url?: string
  set_id?: number | null
  artist?: string
  map_id?: number
  mapper?: string
  title?: string
  type: string
}

export type CreateTournamentMatchRequest = {
  is_possible?: number
  round_id: number
  scheduled_time?: string | null
  team1_id?: number | null
  team2_id?: number | null
}

export type UpdateTournamentMatchRequest = {
  is_possible?: number
  mp_id?: number | null
  result_note?: string | null
  result_type?: "normal" | "wbd" | "ff"
  roll_winner_id?: number | null
  scheduled_time?: string | null
  status?: number
  team1_score?: number
  team1_timeout_used?: number
  team2_score?: number
  team2_timeout_used?: number
  winner_id?: number | null
  winner_overridden?: number
}

export type TournamentMatchAction = {
  action_type: "protect" | "ban" | "pick" | string
  created_by?: number | null
  created_time?: string
  id: number
  map?: TournamentMappoolMap | null
  map_id?: number | null
  match_id: number
  sort_order: number
  team_id?: number | null
  updated_time?: string
  value_json?: string | null
}

export type TournamentRefereeData = {
  actions: TournamentMatchAction[]
  commands: {
    abort?: string
    close?: string
    createRoom?: string
    invite?: string[]
    notify?: string
    rollMessage?: string
    scoreReport?: string
    settings?: string
    start?: string
    timer?: string
  }
  match: TournamentMatch
  roomName: string
  usedMaps?: Record<string, number[]>
}

export type RecordTournamentRollRequest = {
  winner_team_id?: number
}

export type TournamentMatchActionRequest = {
  action_type: "protect" | "ban" | "pick"
  map_id: number
  note?: string | null
  team_id: number
}

export type UpdateTournamentGameScoreRequest = {
  player1_id?: number
  player1_miss_count?: number | null
  player1_score: number
  player2_id?: number
  player2_miss_count?: number | null
  player2_score: number
}

export type TournamentGame = {
  action_by?: number
  action_type?: number
  id: number
  map?: TournamentMappoolMap | null
  map_id: number
  match_id: number
  mp_game_id?: number | null
  order: number
  played_at?: string | null
  player1?: TournamentPlayer | null
  player1_id: number
  player1_miss_count?: number | null
  player1_score: number
  player2?: TournamentPlayer | null
  player2_id: number
  player2_miss_count?: number | null
  player2_score: number
  winner_team: 1 | 2 | number
}

export type TournamentPerformanceEntry = {
  absolute_component: number
  absolute_weight: number
  game_id: number
  gpr?: number
  jpp: number
  match_component: number
  match_id: number
  opponent_score: number
  player?: TournamentPlayer | null
  rank: number
  rating_after: number
  rating_before: number
  rating_delta: number
  reliability: "low" | "medium" | "high" | string
  score: number
  sequence_no: number
  side: 1 | 2 | number
  team: Pick<TournamentTeam, "avatar" | "display_name" | "id" | "name">
  won: boolean
}

export type TournamentPerformanceMap = {
  entries: TournamentPerformanceEntry[]
  key: string
  map: TournamentMappoolMap | null
}

export type TournamentPerformanceStage = {
  key: string
  label: string
  maps: TournamentPerformanceMap[]
}

export type TournamentPerformance = {
  ratings: TournamentPlayerRating[]
  snapshot: TournamentRatingSnapshot | null
  stages: TournamentPerformanceStage[]
}

export type TournamentLeaderboard = {
  stages: TournamentPerformanceStage[]
}

export type TournamentRatingSnapshot = {
  calculated_at: string
  calculated_by: number | null
  finalized_at: string | null
  finalized_by: number | null
  game_count: number
  id: number
  is_final: boolean
  model_version: string
  player_count: number
  source_hash: string
}

export type TournamentPlayerRating = {
  average_gpr?: number
  average_jpp: number
  best_gpr?: number
  best_jpp: number
  game_count: number
  player: TournamentPlayer
  rank: number
  rating_delta: number
  reliability: "low" | "medium" | "high" | string
  team: Pick<TournamentTeam, "avatar" | "display_name" | "id" | "name"> | null
  tpr?: number
  tournament_rating: number
  win_count: number
}

export type TournamentRatingsManage = {
  can_calculate: boolean
  current_game_count: number
  is_calculated: boolean
  is_stale: boolean
  snapshot: TournamentRatingSnapshot | null
}

export type TournamentMappoolStatsMap = {
  ban_count: number
  ban_rate: number | null
  map: TournamentMappoolMap
  pick_count: number
  pick_rate: number | null
  protect_count: number
  protect_rate: number | null
}

export type TournamentMappoolStatsStage = {
  calculated_at: string
  calculated_by: number | null
  completed_match_count: number
  is_complete: boolean
  is_calculated: true
  key: string
  label: string
  maps: TournamentMappoolStatsMap[]
  match_count: number
  valid_match_count: number
}

export type TournamentMappoolStats = {
  stages: TournamentMappoolStatsStage[]
}

export type TournamentMappoolStatsManageStage = {
  can_calculate: boolean
  calculated_at: string | null
  calculated_by: number | null
  completed_match_count: number
  is_calculated: boolean
  is_complete: boolean
  key: string
  label: string
  map_count: number
  match_count: number
  valid_match_count: number | null
}

export type TournamentMappoolStatsManage = {
  stages: TournamentMappoolStatsManageStage[]
}

export type TournamentSection = {
  content_html?: string | null
  content_html_en?: string | null
  content_html_zh?: string | null
  created_time?: string
  format: "markdown" | "html" | string
  id: number
  sort_order: number
  source_markdown?: string | null
  source_markdown_en?: string | null
  source_markdown_zh?: string | null
  title: string
  title_en?: string | null
  title_zh?: string | null
  type: "rules" | "description" | "prize" | "faq" | string
  updated_time?: string
}

export type TournamentSectionRequest = {
  content_html?: string | null
  content_html_en?: string | null
  content_html_zh?: string | null
  format: "markdown" | "html"
  sort_order: number
  source_markdown?: string | null
  source_markdown_en?: string | null
  source_markdown_zh?: string | null
  title: string
  title_en?: string | null
  title_zh?: string | null
  type: string
}

export type TournamentMarkdownPreviewRequest = {
  source_markdown: string
}

export type TournamentMarkdownPreviewResult = {
  content_html: string
}

export type TournamentAuditLog = {
  action: string
  created_time?: string
  entity_id?: number | null
  entity_type: string
  id: number
  new_value_json?: string | null
  old_value_json?: string | null
  operator?: TournamentUser | null
  operator_id?: number | null
}

export type TournamentAuditLogList = {
  page: number
  pageSize: number
  rows: TournamentAuditLog[]
  total: number
}

export type TournamentAuditLogQuery = {
  action?: string
  entity_id?: string
  entity_type?: string
  operator_id?: string
  page?: number
  pageSize?: number
}

export type TournamentQualMap = {
  artist: string
  id: number
  index: number
  map_id: number
  mapper: string
  set_id?: number | null
  star?: number | string | null
  title: string
  version?: string | null
  weight?: number
}

export type TournamentQualScore = {
  attempt_no?: number | null
  id: number
  importLog?: TournamentQualImport | null
  import_id?: number | null
  is_manual?: number | boolean
  map?: TournamentQualMap | null
  map_id: number
  player?: TournamentPlayer | null
  player_id?: number | null
  score: number
  source_game_id?: number | null
  source_mp_id?: number | null
  team?: TournamentTeam | null
  team_id: number
}

export type TournamentQualImport = {
  created_time?: string
  id: number
  importedBy?: TournamentUser | null
  imported_by?: number | null
  message?: string | null
  mp_id: number
  status: "running" | "success" | "failed" | string
  team?: TournamentTeam | null
  team_id: number
}

export type TournamentQualImportList = {
  page: number
  pageSize: number
  rows: TournamentQualImport[]
  total: number
}

export type CreateTournamentQualMapRequest = {
  index: number
  url: string
  weight?: number
}

export type UpdateTournamentQualMapRequest = {
  artist?: string
  index?: number
  map_id?: number
  mapper?: string
  title?: string
  weight?: number
}

export type FetchTournamentQualScoresRequest = {
  mp_id?: number
  mp_ids?: number[]
  team_id?: number
}

export type UpdateTournamentQualScoreRequest = {
  score: number
}

export type CreateTournamentTeamRequest = {
  display_name?: string
  is_open: boolean
  name: string
}

export type UpdateTournamentTeamInfoRequest = {
  display_name?: string
  is_open?: boolean
  name: string
}

export type TransferTournamentCaptainRequest = {
  player_id: number
}

export type JoinTournamentTeamRequest = {
  invite_code?: string
  team_id?: number
}

export type TournamentHistoricalImportPlayerRequest = {
  avatar?: string | null
  avatar_snapshot?: string | null
  contact_discord?: string | null
  contact_qq?: string | null
  is_captain?: boolean | number
  osu_uid?: number | null
  remark?: string | null
  review_status?: "review_pending" | "review_passed" | "review_failed"
  timezone?: string | null
  user_id?: number | null
  user_name?: string | null
  user_name_snapshot?: string | null
}

export type TournamentHistoricalImportTeamRequest = {
  avatar?: string | null
  display_name?: string | null
  is_open?: boolean | number
  locked_at?: string | null
  name: string
  players: TournamentHistoricalImportPlayerRequest[]
  qual_mp_id?: number | null
  qual_rank?: number | null
  qual_score?: number | null
  status?: number
}

export type TournamentHistoricalImportRequest = {
  batch_id: string
  dry_run?: boolean
  teams: TournamentHistoricalImportTeamRequest[]
}

export type TournamentGoogleFormImportRequest = {
  batch_id?: string | null
  csv_text?: string | null
  dry_run?: boolean
  source_url?: string | null
}

export type TournamentHistoricalImportResultPlayer = {
  created_user: boolean
  is_captain: boolean
  osu_uid?: number | null
  user_id: number
  user_name_snapshot: string
}

export type TournamentHistoricalImportResultTeam = {
  captain_user_id: number
  display_name: string
  player_count: number
  players: TournamentHistoricalImportResultPlayer[]
  team_id?: number | null
}

export type TournamentHistoricalImportResult = {
  batch_id: string
  created_users: Array<{
    osu_uid?: number | null
    user_id: number
    user_name: string
  }>
  dry_run: boolean
  teams: TournamentHistoricalImportResultTeam[]
}

export function getTournamentStatus(tournament: Pick<Tournament, "qual_end" | "qual_start" | "reg_end" | "reg_start" | "status">) {
  if (tournament.status === 4) return { key: "completed", label: "Completed", tone: "muted" as const }
  if (tournament.status === 3) return { key: "mainStage", label: "Main stage", tone: "warning" as const }
  if (tournament.status === 2) return { key: "qualifier", label: "Qualifier", tone: "info" as const }
  if (tournament.status === 1) return { key: "registration", label: "Registration", tone: "success" as const }

  const now = Date.now()
  const regStart = tournament.reg_start ? new Date(tournament.reg_start).getTime() : Number.NaN
  const regEnd = tournament.reg_end ? new Date(tournament.reg_end).getTime() : Number.NaN
  const qualStart = tournament.qual_start ? new Date(tournament.qual_start).getTime() : Number.NaN
  const qualEnd = tournament.qual_end ? new Date(tournament.qual_end).getTime() : Number.NaN

  if (!Number.isNaN(regStart) && now < regStart) return { key: "upcoming", label: "Upcoming", tone: "muted" as const }
  if (!Number.isNaN(regEnd) && now <= regEnd) return { key: "registration", label: "Registration", tone: "success" as const }
  if (!Number.isNaN(qualStart) && !Number.isNaN(qualEnd) && now >= qualStart && now <= qualEnd) {
    return { key: "qualifier", label: "Qualifier", tone: "info" as const }
  }
  if (!Number.isNaN(qualEnd) && now > qualEnd) return { key: "mainStage", label: "Main stage", tone: "warning" as const }
  return { key: "upcoming", label: "Scheduled", tone: "muted" as const }
}

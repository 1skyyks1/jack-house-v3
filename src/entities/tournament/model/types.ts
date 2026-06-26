export type TournamentUser = {
  avatar?: string | null
  user_id: number
  user_name: string
}

export type TournamentStaff = {
  id: number
  role: "host" | "pooler" | "referee" | "streamer" | "commentator" | string
  user?: TournamentUser
  user_id: number
}

export type TournamentStaffRole = "host" | "pooler" | "referee" | "streamer" | "commentator"

export type CreateTournamentStaffRequest = {
  role: TournamentStaffRole
  user_id: number
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
  desc_en?: string | null
  desc_zh?: string | null
  id: number
  name: string
  qual_end?: string | null
  qual_locked_at?: string | null
  qual_locked_by?: number | null
  qual_locked_top_n?: number | null
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
  team1_roll?: number | null
  team1_score: number
  team1_timeout_used?: number
  team2?: TournamentTeam | null
  team2_id?: number | null
  team2_roll?: number | null
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
  artist: string
  map_id: number
  mapper: string
  title: string
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
  scheduled_time?: string | null
  status?: number
  team1_roll?: number | null
  team1_score?: number
  team1_timeout_used?: number
  team2_roll?: number | null
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
    rollMessage?: string
    settings?: string
    start?: string
    timer?: string
  }
  match: TournamentMatch
  roomName: string
  usedMaps?: Record<string, number[]>
}

export type RecordTournamentRollRequest = {
  team1_roll: number
  team2_roll: number
}

export type TournamentMatchActionRequest = {
  action_type: "protect" | "ban" | "pick"
  map_id: number
  note?: string | null
  team_id: number
}

export type UpdateTournamentGameScoreRequest = {
  player1_id?: number
  player1_score: number
  player2_id?: number
  player2_score: number
}

export type TournamentGame = {
  action_by?: number
  action_type?: number
  id: number
  map?: TournamentMappoolMap | null
  map_id: number
  match_id: number
  order: number
  player1_id: number
  player1_score: number
  player2_id: number
  player2_score: number
  winner_team: 1 | 2 | number
}

export type TournamentSection = {
  content_html?: string | null
  created_time?: string
  format: "markdown" | "html" | string
  id: number
  sort_order: number
  source_markdown?: string | null
  title: string
  type: "rules" | "description" | "prize" | "faq" | string
  updated_time?: string
}

export type TournamentSectionRequest = {
  content_html?: string | null
  format: "markdown" | "html"
  sort_order: number
  source_markdown?: string | null
  title: string
  type: "rules" | "description" | "prize" | "faq"
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
  mp_id: number
  team_id?: number
}

export type UpdateTournamentQualScoreRequest = {
  score: number
}

export type CreateTournamentTeamRequest = {
  avatar?: string | null
  display_name?: string
  is_open: boolean
  name: string
}

export type UpdateTournamentTeamInfoRequest = {
  avatar?: string | null
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

export function getTournamentStatus(tournament: Pick<Tournament, "qual_end" | "qual_start" | "reg_end" | "reg_start">) {
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

import { z } from "zod"
import type { CreateTournamentRequest, Tournament } from "@/entities/tournament"

export const tournamentSettingsSchema = z.object({
  acronym: z.string().trim().min(2, "Acronym is required").max(32, "Acronym must be 32 characters or fewer"),
  banner: z.string().trim().url("Banner must be a valid URL").or(z.literal("")),
  desc_en: z.string().trim().max(255, "English description must be 255 characters or fewer").optional(),
  desc_zh: z.string().trim().max(255, "Chinese description must be 255 characters or fewer").optional(),
  name: z.string().trim().min(2, "Tournament name is required").max(255, "Tournament name must be 255 characters or fewer"),
  qual_end: z.string().optional(),
  qual_start: z.string().optional(),
  qual_top_n: z.number().int().min(2).max(128),
  reg_end: z.string().min(1, "Registration end is required"),
  reg_start: z.string().min(1, "Registration start is required"),
  team_size_max: z.number().int().min(1).max(8),
  team_size_min: z.number().int().min(1).max(8),
}).superRefine((values, ctx) => {
  if (values.team_size_min > values.team_size_max) {
    ctx.addIssue({
      code: "custom",
      message: "Minimum team size cannot be greater than maximum team size",
      path: ["team_size_min"],
    })
  }
  if (values.reg_start && values.reg_end && new Date(values.reg_start) >= new Date(values.reg_end)) {
    ctx.addIssue({
      code: "custom",
      message: "Registration end must be after registration start",
      path: ["reg_end"],
    })
  }
  if (values.qual_start && values.qual_end && new Date(values.qual_start) >= new Date(values.qual_end)) {
    ctx.addIssue({
      code: "custom",
      message: "Qualifier end must be after qualifier start",
      path: ["qual_end"],
    })
  }
})

export type TournamentSettingsFormValues = z.infer<typeof tournamentSettingsSchema>

export const tournamentSettingsDefaultValues: TournamentSettingsFormValues = {
  acronym: "",
  banner: "",
  desc_en: "",
  desc_zh: "",
  name: "",
  qual_end: "",
  qual_start: "",
  qual_top_n: 32,
  reg_end: "",
  reg_start: "",
  team_size_max: 2,
  team_size_min: 1,
}

export function toTournamentMutationRequest(values: TournamentSettingsFormValues): CreateTournamentRequest {
  return {
    acronym: values.acronym.trim(),
    banner: emptyToNull(values.banner),
    desc_en: emptyToNull(values.desc_en),
    desc_zh: emptyToNull(values.desc_zh),
    name: values.name.trim(),
    qual_end: toIsoOrNull(values.qual_end),
    qual_rank_mode: 0,
    qual_start: toIsoOrNull(values.qual_start),
    qual_top_n: values.qual_top_n,
    reg_end: toIsoOrNull(values.reg_end) ?? "",
    reg_start: toIsoOrNull(values.reg_start) ?? "",
    team_size_max: values.team_size_max,
    team_size_min: values.team_size_min,
  }
}

export function toTournamentSettingsFormValues(tournament: Tournament): TournamentSettingsFormValues {
  return {
    acronym: tournament.acronym ?? "",
    banner: tournament.banner ?? "",
    desc_en: tournament.desc_en ?? "",
    desc_zh: tournament.desc_zh ?? "",
    name: tournament.name ?? "",
    qual_end: toDatetimeLocal(tournament.qual_end),
    qual_start: toDatetimeLocal(tournament.qual_start),
    qual_top_n: tournament.qual_top_n ?? 32,
    reg_end: toDatetimeLocal(tournament.reg_end),
    reg_start: toDatetimeLocal(tournament.reg_start),
    team_size_max: tournament.team_size_max ?? 2,
    team_size_min: tournament.team_size_min ?? 1,
  }
}

function emptyToNull(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function toIsoOrNull(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

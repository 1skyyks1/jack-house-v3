import type { ManiaBeatmapSource } from "./types"

const MAX_LOCAL_BEATMAP_SIZE = 2 * 1024 * 1024

export type LocalBeatmapErrorCode = "file-too-large" | "invalid-file"

export class LocalBeatmapError extends Error {
  code: LocalBeatmapErrorCode

  constructor(code: LocalBeatmapErrorCode) {
    super(code)
    this.name = "LocalBeatmapError"
    this.code = code
  }
}

export async function createLocalManiaBeatmapSource(file: File, coverUrl: string): Promise<ManiaBeatmapSource> {
  if (!file.name.toLowerCase().endsWith(".osu")) throw new LocalBeatmapError("invalid-file")
  if (file.size > MAX_LOCAL_BEATMAP_SIZE) throw new LocalBeatmapError("file-too-large")

  const osuText = (await file.text()).replace(/^\uFEFF/, "")
  if (!/^osu file format v\d+/im.test(osuText) || !osuText.includes("[HitObjects]")) {
    throw new LocalBeatmapError("invalid-file")
  }

  const sections = parseSections(osuText)
  const general = parseKeyValues(sections.get("General") ?? [])
  const metadata = parseKeyValues(sections.get("Metadata") ?? [])
  const mode = general.get("Mode") ?? ""

  return {
    beatmap: {
      artist: metadata.get("ArtistUnicode") || metadata.get("Artist") || "",
      beatmapId: toInteger(metadata.get("BeatmapID")) ?? 0,
      beatmapsetId: toInteger(metadata.get("BeatmapSetID")),
      bpm: getBaseBpm(sections.get("TimingPoints") ?? []),
      coverUrl,
      creator: metadata.get("Creator") || "",
      difficultyRating: null,
      mode,
      title: metadata.get("TitleUnicode") || metadata.get("Title") || file.name.replace(/\.osu$/i, ""),
      totalLength: getTotalLength(sections.get("HitObjects") ?? []),
      version: metadata.get("Version") || "",
    },
    osuText,
  }
}

function parseSections(osuText: string) {
  const sections = new Map<string, string[]>()
  let currentSection = ""

  for (const rawLine of osuText.split(/\r?\n/)) {
    const line = rawLine.trim()
    const sectionMatch = line.match(/^\[([^\]]+)]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      if (!sections.has(currentSection)) sections.set(currentSection, [])
      continue
    }
    if (currentSection && line && !line.startsWith("//")) sections.get(currentSection)?.push(line)
  }

  return sections
}

function parseKeyValues(lines: string[]) {
  const values = new Map<string, string>()
  for (const line of lines) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex < 0) continue
    values.set(line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim())
  }
  return values
}

function getBaseBpm(lines: string[]) {
  for (const line of lines) {
    const parts = line.split(",")
    const beatLength = Number(parts[1])
    const uninherited = parts[6] == null ? 1 : Number(parts[6])
    if (Number.isFinite(beatLength) && beatLength > 0 && uninherited === 1) {
      return Math.round((60_000 / beatLength) * 100) / 100
    }
  }
  return null
}

function getTotalLength(lines: string[]) {
  let lastTime = 0
  for (const line of lines) {
    const parts = line.split(",")
    const startTime = Number(parts[2])
    const noteType = Number(parts[3])
    let endTime = startTime
    if ((noteType & 128) !== 0 && parts[5]) endTime = Number(parts[5].split(":")[0])
    if (Number.isFinite(endTime)) lastTime = Math.max(lastTime, endTime)
  }
  return lastTime > 0 ? Math.round(lastTime / 1000) : null
}

function toInteger(value: string | undefined) {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

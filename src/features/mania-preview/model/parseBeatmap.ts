import type { ManiaPreviewBeatmap, ManiaPreviewNote, ManiaPreviewTimingPoint } from "./types"

export function parseManiaPreviewBeatmap(osuText: string): ManiaPreviewBeatmap {
  const normalizedText = osuText.replace(/^\uFEFF/, "")
  if (!/^osu file format v\d+/im.test(normalizedText)) throw new Error("Invalid osu! beatmap")

  const sections = new Map<string, string[]>()
  let currentSection = ""
  for (const rawLine of normalizedText.split(/\r?\n/)) {
    const line = rawLine.trim()
    const sectionMatch = line.match(/^\[([^\]]+)]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      if (!sections.has(currentSection)) sections.set(currentSection, [])
      continue
    }
    if (currentSection && line && !line.startsWith("//")) sections.get(currentSection)?.push(line)
  }

  const general = parseKeyValues(sections.get("General") ?? [])
  const difficulty = parseKeyValues(sections.get("Difficulty") ?? [])
  if (Number(general.get("Mode")) !== 3) throw new Error("Beatmap is not osu!mania")

  const keyCount = Math.round(Number(difficulty.get("CircleSize")))
  if (!Number.isInteger(keyCount) || keyCount < 1 || keyCount > 18) throw new Error("Invalid mania key count")

  const timingPoints = (sections.get("TimingPoints") ?? [])
    .map(parseTimingPoint)
    .filter((point): point is ManiaPreviewTimingPoint => point !== null)
    .sort((left, right) => left.time - right.time)
  const notes = (sections.get("HitObjects") ?? [])
    .map((line) => parseHitObject(line, keyCount))
    .filter((note): note is ManiaPreviewNote => note !== null)
    .sort((left, right) => left.startTime - right.startTime)

  const lastNoteTime = notes.reduce((latest, note) => Math.max(latest, note.endTime ?? note.startTime), 0)
  const totalTime = Math.max(1_000, lastNoteTime)
  const rawPreviewTime = Number(general.get("PreviewTime"))
  const previewTime = Number.isFinite(rawPreviewTime) && rawPreviewTime >= 0
    ? Math.min(rawPreviewTime, Math.max(0, totalTime - 1))
    : 0

  return { keyCount, notes, previewTime, timingPoints, totalTime }
}

function parseKeyValues(lines: string[]) {
  const values = new Map<string, string>()
  for (const line of lines) {
    const separator = line.indexOf(":")
    if (separator <= 0) continue
    values.set(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
  return values
}

function parseTimingPoint(line: string): ManiaPreviewTimingPoint | null {
  const parts = line.split(",")
  const time = Number(parts[0])
  const beatLength = Number(parts[1])
  if (!Number.isFinite(time) || !Number.isFinite(beatLength)) return null
  return { beatLength, time, uninherited: Number(parts[6] ?? 1) === 1 }
}

function parseHitObject(line: string, keyCount: number): ManiaPreviewNote | null {
  const parts = line.split(",")
  const x = Number(parts[0])
  const startTime = Number(parts[2])
  const type = Number(parts[3])
  if (!Number.isFinite(x) || !Number.isFinite(startTime) || !Number.isInteger(type)) return null

  const column = Math.max(0, Math.min(keyCount - 1, Math.floor((x * keyCount) / 512)))
  let endTime: number | null = null
  if ((type & 128) !== 0) {
    const parsedEndTime = Number(parts[5]?.split(":")[0])
    endTime = Number.isFinite(parsedEndTime) ? Math.max(startTime, parsedEndTime) : startTime + 1
  }
  return { column, endTime, startTime }
}

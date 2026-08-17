import { strToU8, zip, type AsyncZippable } from "fflate"

export type BeatmapMetadata = {
  artist: string
  audioFilename: string
  backgroundFilename: string
  creator: string
  hpDrainRate: number
  overallDifficulty: number
  title: string
  version: string
}

export type LocalBeatmap = {
  file: File
  key: string
  metadata: BeatmapMetadata
  parentPath: string
  relativePath: string
}

export type BeatmapEdit = {
  hpDrainRate: number
  overallDifficulty: number
  version: string
}

export type PackBuildOptions = {
  artist: string
  beatmaps: LocalBeatmap[]
  creator: string
  deleteAssets?: {
    audio: Uint8Array
    background: Uint8Array
    template: string
  }
  edits: Record<string, BeatmapEdit>
  files: File[]
  onProgress?: (current: number, total: number, label: string) => void
  title: string
}

export type PackBuildResult = {
  beatmapCount: number
  blob: Blob
  fileCount: number
  filename: string
  missingAssets: string[]
}

export async function scanBeatmaps(
  files: File[],
  onProgress?: (current: number, total: number) => void,
): Promise<LocalBeatmap[]> {
  const osuFiles = files.filter((file) => file.name.toLowerCase().endsWith(".osu"))
  const beatmaps: LocalBeatmap[] = []

  for (let index = 0; index < osuFiles.length; index += 1) {
    const file = osuFiles[index]
    const relativePath = getRelativePath(file)
    const content = await file.text()
    beatmaps.push({
      file,
      key: `${relativePath}:${file.lastModified}:${file.size}`,
      metadata: parseBeatmapMetadata(content),
      parentPath: getParentPath(relativePath),
      relativePath,
    })
    onProgress?.(index + 1, osuFiles.length)

    if ((index + 1) % 40 === 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0))
    }
  }

  return beatmaps.sort((left, right) => left.relativePath.localeCompare(right.relativePath))
}

export function createDefaultEdit(metadata: BeatmapMetadata): BeatmapEdit {
  const artist = metadata.artist.trim() || "Unknown"
  const title = metadata.title.trim() || "Untitled"
  const creator = metadata.creator.trim() || "Unknown"
  const version = metadata.version.trim() || "Unnamed"

  return {
    hpDrainRate: metadata.hpDrainRate,
    overallDifficulty: metadata.overallDifficulty,
    version: `${artist} - ${title} [${creator}] (${version})`,
  }
}

export function parseBeatmapMetadata(content: string): BeatmapMetadata {
  const metadata: BeatmapMetadata = {
    artist: "",
    audioFilename: "",
    backgroundFilename: "",
    creator: "",
    hpDrainRate: 5,
    overallDifficulty: 5,
    title: "",
    version: "",
  }
  let section = ""

  for (const rawLine of content.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.startsWith("[") && line.endsWith("]")) {
      section = line.slice(1, -1)
      continue
    }

    const separator = line.indexOf(":")
    if (separator >= 0) {
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim()
      if (section === "General" && key === "AudioFilename") metadata.audioFilename = value
      if (section === "Metadata" && key === "Title") metadata.title = value
      if (section === "Metadata" && key === "Artist") metadata.artist = value
      if (section === "Metadata" && key === "Creator") metadata.creator = value
      if (section === "Metadata" && key === "Version") metadata.version = value
      if (section === "Difficulty" && key === "HPDrainRate") metadata.hpDrainRate = finiteNumber(value, 5)
      if (section === "Difficulty" && key === "OverallDifficulty") metadata.overallDifficulty = finiteNumber(value, 5)
      continue
    }

    if (section === "Events" && !metadata.backgroundFilename) {
      const background = line.match(/^\s*0\s*,\s*0\s*,\s*"([^"]+)"/)
      if (background) metadata.backgroundFilename = background[1]
    }
  }

  return metadata
}

export async function buildMappack(options: PackBuildOptions): Promise<PackBuildResult> {
  const title = options.title.trim()
  const artist = options.artist.trim()
  const creator = options.creator.trim()
  if (!title || !artist || !creator) throw new Error("Pack title, artist, and creator are required.")
  if (options.beatmaps.length === 0) throw new Error("Select at least one beatmap.")

  const sourceFiles = createSourceFileIndex(options.files)
  const entries: AsyncZippable = {}
  const reservedNames = new Set<string>()
  const copiedAssets = new Map<string, string>()
  const missingAssets: string[] = []

  for (let index = 0; index < options.beatmaps.length; index += 1) {
    const beatmap = options.beatmaps[index]
    const edit = options.edits[beatmap.key] ?? createDefaultEdit(beatmap.metadata)
    options.onProgress?.(index + 1, options.beatmaps.length, beatmap.relativePath)

    const source = await beatmap.file.text()
    const audio = findSiblingFile(sourceFiles, beatmap.parentPath, beatmap.metadata.audioFilename)
    const background = findSiblingFile(sourceFiles, beatmap.parentPath, beatmap.metadata.backgroundFilename)
    const audioName = await addAsset(entries, reservedNames, copiedAssets, audio, edit.version, "audio")
    const backgroundName = await addAsset(
      entries,
      reservedNames,
      copiedAssets,
      background,
      edit.version,
      "bg",
      true,
    )

    if (beatmap.metadata.audioFilename && !audio) {
      missingAssets.push(`${beatmap.relativePath}: ${beatmap.metadata.audioFilename}`)
    }
    if (beatmap.metadata.backgroundFilename && !background) {
      missingAssets.push(`${beatmap.relativePath}: ${beatmap.metadata.backgroundFilename}`)
    }

    const rewritten = rewriteBeatmap(source, {
      artist,
      audioFilename: audioName,
      backgroundFilename: backgroundName,
      creator,
      hpDrainRate: finiteNumber(edit.hpDrainRate, beatmap.metadata.hpDrainRate),
      overallDifficulty: finiteNumber(edit.overallDifficulty, beatmap.metadata.overallDifficulty),
      title,
      version: edit.version.trim() || beatmap.metadata.version || "Unnamed",
    })
    const osuFilename = reserveName(
      reservedNames,
      `${sanitizeFilename(`${artist} - ${title} (${creator}) [${edit.version.trim() || "Unnamed"}]`)}.osu`,
    )
    entries[osuFilename] = [strToU8(rewritten), { level: 6 }]
  }

  if (options.deleteAssets) {
    const mediaBase = sanitizeFilename(`${title} delete this`)
    const audioName = reserveName(reservedNames, `${mediaBase}.mp3`)
    const backgroundName = reserveName(reservedNames, `${sanitizeEventFilename(mediaBase)}.jpg`)
    const osuName = reserveName(
      reservedNames,
      `${sanitizeFilename(`${artist} - ${title} (${creator}) [delete this]`)}.osu`,
    )
    entries[audioName] = [options.deleteAssets.audio, { level: 0 }]
    entries[backgroundName] = [options.deleteAssets.background, { level: 0 }]
    entries[osuName] = [
      strToU8(rewriteBeatmap(options.deleteAssets.template, {
        artist,
        audioFilename: audioName,
        backgroundFilename: backgroundName,
        creator,
        hpDrainRate: 5,
        overallDifficulty: 5,
        preserveIds: true,
        preserveSourceAndTags: true,
        title,
        version: "delete this",
      })),
      { level: 6 },
    ]
  }

  const archive = await createZip(entries)
  const archiveBuffer = new ArrayBuffer(archive.byteLength)
  new Uint8Array(archiveBuffer).set(archive)
  return {
    beatmapCount: options.beatmaps.length,
    blob: new Blob([archiveBuffer], { type: "application/x-osu-beatmap-archive" }),
    fileCount: Object.keys(entries).length,
    filename: `${sanitizeFilename(title)}.osz`,
    missingAssets,
  }
}

type RewriteOptions = {
  artist: string
  audioFilename: string | null
  backgroundFilename: string | null
  creator: string
  hpDrainRate: number
  overallDifficulty: number
  preserveIds?: boolean
  preserveSourceAndTags?: boolean
  title: string
  version: string
}

function rewriteBeatmap(content: string, options: RewriteOptions) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/)
  const output: string[] = []
  let section = ""
  let backgroundReplaced = !options.backgroundFilename

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      section = trimmed.slice(1, -1)
      output.push(rawLine)
      continue
    }

    const separator = trimmed.indexOf(":")
    if (separator >= 0) {
      const key = trimmed.slice(0, separator).trim()
      const replacement = getFieldReplacement(section, key, options)
      if (replacement !== undefined) {
        output.push(`${key}:${replacement}`)
        continue
      }
    }

    if (section === "Events" && !backgroundReplaced && /^\s*0\s*,\s*0\s*,\s*"[^"]+"/.test(trimmed)) {
      output.push(`0,0,"${options.backgroundFilename}",0,0`)
      backgroundReplaced = true
      continue
    }

    output.push(rawLine)
  }

  return `${output.join("\r\n").replace(/(?:\r\n)+$/, "")}\r\n`
}

function getFieldReplacement(section: string, key: string, options: RewriteOptions) {
  if (section === "General" && key === "AudioFilename" && options.audioFilename) return options.audioFilename
  if (section === "Difficulty" && key === "HPDrainRate") return String(options.hpDrainRate)
  if (section === "Difficulty" && key === "OverallDifficulty") return String(options.overallDifficulty)
  if (section !== "Metadata") return undefined

  if (key === "Title" || key === "TitleUnicode") return options.title
  if (key === "Artist" || key === "ArtistUnicode") return options.artist
  if (key === "Creator") return options.creator
  if (key === "Version") return options.version
  if (!options.preserveSourceAndTags && (key === "Source" || key === "Tags")) return ""
  if (!options.preserveIds && key === "BeatmapID") return "0"
  if (!options.preserveIds && key === "BeatmapSetID") return "-1"
  return undefined
}

async function addAsset(
  entries: AsyncZippable,
  reservedNames: Set<string>,
  copiedAssets: Map<string, string>,
  file: File | null,
  version: string,
  fallbackExtension: string,
  isEventAsset = false,
) {
  if (!file) return null
  const sourceKey = `${getRelativePath(file).toLowerCase()}:${file.lastModified}:${file.size}`
  const existingName = copiedAssets.get(sourceKey)
  if (existingName) return existingName

  const extension = getExtension(file.name) || fallbackExtension
  const sanitizedVersion = isEventAsset
    ? sanitizeEventFilename(version || "asset")
    : sanitizeFilename(version || "asset")
  const filename = reserveName(reservedNames, `${sanitizedVersion}.${extension}`)
  entries[filename] = [new Uint8Array(await file.arrayBuffer()), { level: isCompressedMedia(extension) ? 0 : 6 }]
  copiedAssets.set(sourceKey, filename)
  return filename
}

function createSourceFileIndex(files: File[]) {
  return new Map(files.map((file) => [normalizePath(getRelativePath(file)).toLowerCase(), file]))
}

function findSiblingFile(index: Map<string, File>, parentPath: string, filename: string) {
  const cleanFilename = filename.trim().replace(/^"|"$/g, "")
  if (!cleanFilename) return null
  return index.get(normalizePath(`${parentPath}/${cleanFilename}`).toLowerCase()) ?? null
}

function getRelativePath(file: File) {
  return normalizePath(file.webkitRelativePath || file.name)
}

function getParentPath(path: string) {
  const separator = path.lastIndexOf("/")
  return separator < 0 ? "" : path.slice(0, separator)
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").replace(/\/{2,}/g, "/")
}

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".")
  return index < 0 ? "" : filename.slice(index + 1).toLowerCase().replace(/[^a-z0-9]/g, "")
}

function isCompressedMedia(extension: string) {
  return ["mp3", "ogg", "wav", "jpg", "jpeg", "png", "gif", "mp4", "webm", "avi", "mov"].includes(extension)
}

function sanitizeFilename(value: string) {
  const printableValue = [...value].map((character) => character.charCodeAt(0) < 32 ? "_" : character).join("")
  const sanitized = printableValue.replace(/[<>:"/\\|?*]/g, "_").replace(/[. ]+$/g, "").trim()
  return sanitized || "mappack"
}

function sanitizeEventFilename(value: string) {
  return sanitizeFilename(value).replace(/,/g, "_")
}

function reserveName(reserved: Set<string>, preferred: string) {
  const normalized = preferred.toLowerCase()
  if (!reserved.has(normalized)) {
    reserved.add(normalized)
    return preferred
  }

  const extensionIndex = preferred.lastIndexOf(".")
  const stem = extensionIndex > 0 ? preferred.slice(0, extensionIndex) : preferred
  const extension = extensionIndex > 0 ? preferred.slice(extensionIndex) : ""
  for (let index = 2; ; index += 1) {
    const candidate = `${stem}-${index}${extension}`
    const candidateKey = candidate.toLowerCase()
    if (!reserved.has(candidateKey)) {
      reserved.add(candidateKey)
      return candidate
    }
  }
}

function finiteNumber(value: number | string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function createZip(entries: AsyncZippable) {
  return new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, { level: 6 }, (error, archive) => {
      if (error) reject(error)
      else resolve(archive)
    })
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

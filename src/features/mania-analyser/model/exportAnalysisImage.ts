import type { ManiaAnalysisOptions, ManiaAnalysisResult, ManiaBeatmapSource, ManiaEtternaSkill } from "./types"

const WIDTH = 1600
const HEIGHT = 2000
const CHART_SIDE_INSET = 128
const SKILLS: ManiaEtternaSkill[] = ["Stream", "Jumpstream", "Handstream", "Stamina", "JackSpeed", "Chordjack", "Technical"]
const PATTERN_COLORS = ["#67E8F9", "#38BDF8", "#3B82F6", "#6366F1", "#A855F7", "#EC4899"]

export type ManiaAnalysisImageLabels = {
  bpm: string
  difficultyGraph: string
  duration: string
  estimatedDifficulty: string
  generatedBy: string
  lnRatio: string
  mappedBy: string
  msd: string
  od: string
  patternSummary: string
  rate: string
  reworkStar: string
  lnToRice: string
  riceToLn: string
  skillLabels: Record<ManiaEtternaSkill, string>
  unknown: string
}

type ExportManiaAnalysisImageInput = {
  difficultyColor: string
  difficultyTextColor: string
  fallbackCoverUrl: string
  labels: ManiaAnalysisImageLabels
  options: Pick<ManiaAnalysisOptions, "cvtFlag" | "odFlag" | "speedRate">
  result: ManiaAnalysisResult
  source: ManiaBeatmapSource
}

export async function downloadManiaAnalysisImage(input: ExportManiaAnalysisImageInput) {
  await document.fonts.ready
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")

  drawBackground(context)
  const cover = await loadCover(input.source.beatmap.coverUrl, input.fallbackCoverUrl)
  if (cover) drawCover(context, cover)
  drawHero(context, input)
  drawMetrics(context, input)
  drawSectionHeadings(context, input.labels)
  drawRadar(context, input.result, input.labels)
  drawPatternDonut(context, input.result, input.labels)
  drawDifficultyGraph(context, input.result, input.labels)
  drawFooter(context, input.labels)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Unable to encode image")), "image/png")
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.download = `${sanitizeFilename(input.source.beatmap.artist || "osu-mania")}-${sanitizeFilename(input.source.beatmap.title || "analysis")}.png`
  link.href = url
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  return blob
}

function drawBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#070A0F"
  context.fillRect(0, 0, WIDTH, HEIGHT)
  const glow = context.createRadialGradient(1260, 700, 0, 1260, 700, 920)
  glow.addColorStop(0, "rgba(14, 116, 144, 0.18)")
  glow.addColorStop(0.55, "rgba(30, 64, 175, 0.08)")
  glow.addColorStop(1, "rgba(7, 10, 15, 0)")
  context.fillStyle = glow
  context.fillRect(0, 360, WIDTH, 1350)
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement) {
  const targetHeight = 560
  const scale = Math.max(WIDTH / image.naturalWidth, targetHeight / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  context.save()
  context.beginPath()
  context.rect(0, 0, WIDTH, targetHeight)
  context.clip()
  context.globalAlpha = 0.82
  context.drawImage(image, (WIDTH - width) / 2, (targetHeight - height) / 2, width, height)
  context.restore()

  const overlay = context.createLinearGradient(0, 0, 0, targetHeight)
  overlay.addColorStop(0, "rgba(7, 10, 15, 0.28)")
  overlay.addColorStop(0.58, "rgba(7, 10, 15, 0.68)")
  overlay.addColorStop(1, "#070A0F")
  context.fillStyle = overlay
  context.fillRect(0, 0, WIDTH, targetHeight)
}

function drawHero(context: CanvasRenderingContext2D, input: ExportManiaAnalysisImageInput) {
  const { labels, result } = input
  const map = input.source.beatmap
  context.fillStyle = "rgba(255,255,255,0.62)"
  setFont(context, 24, 650, true)
  context.fillText("JACK HOUSE  /  osu!mania map analyser", 96, 94)

  context.fillStyle = "rgba(255,255,255,0.7)"
  setFont(context, 27, 550)
  context.fillText(fitText(context, map.artist || labels.unknown, 980), 96, 250)
  context.fillStyle = "#FFFFFF"
  setFont(context, 58, 720, true)
  context.fillText(fitText(context, map.title || labels.unknown, 1050), 96, 324)
  context.fillStyle = "rgba(255,255,255,0.72)"
  setFont(context, 28, 520)
  context.fillText(fitText(context, map.version || labels.unknown, 970), 96, 372)
  setFont(context, 22, 500)
  context.fillStyle = "rgba(255,255,255,0.5)"
  context.fillText(`${labels.mappedBy} ${map.creator || labels.unknown}`, 96, 420)

  drawRoundedRect(context, 1230, 180, 274, 112, 56, input.difficultyColor)
  context.fillStyle = input.difficultyTextColor
  setFont(context, 22, 760, true)
  context.textAlign = "center"
  context.fillText(labels.msd.toUpperCase(), 1367, 218)
  setFont(context, 47, 760, true)
  context.fillText(result.etterna.values.Overall.toFixed(2), 1367, 270)
  context.textAlign = "left"

  context.fillStyle = "rgba(255,255,255,0.55)"
  setFont(context, 20, 650, true)
  context.textAlign = "right"
  context.fillText(labels.estimatedDifficulty.toUpperCase(), 1504, 356)
  context.fillStyle = "#FFFFFF"
  const estimatedDifficulty = splitEstimatedDifficulty(result.estDiff)
  setFont(context, estimatedDifficulty.secondary ? 34 : 38, 700, true)
  context.fillText(estimatedDifficulty.primary, 1504, estimatedDifficulty.secondary ? 396 : 406)
  if (estimatedDifficulty.secondary) {
    context.fillStyle = "rgba(255,255,255,0.84)"
    setFont(context, 27, 680, true)
    context.fillText(estimatedDifficulty.secondary, 1504, 436)
  }
  context.textAlign = "left"

  drawActiveOptions(context, input)
}

function drawActiveOptions(context: CanvasRenderingContext2D, input: ExportManiaAnalysisImageInput) {
  const options = []
  if (Math.abs(input.options.speedRate - 1) > 0.0001) {
    options.push(`${input.labels.rate} ${formatNumber(input.options.speedRate)}×`)
  }
  if (input.options.odFlag !== null) {
    options.push(`${input.labels.od} ${formatNumber(input.options.odFlag)}`)
  }
  if (input.options.cvtFlag) {
    options.push(input.options.cvtFlag === "HO" ? input.labels.lnToRice : input.labels.riceToLn)
  }
  if (options.length === 0) return

  let x = 96
  const y = 134
  setFont(context, 19, 680, true)
  for (const option of options) {
    const width = context.measureText(option).width + 34
    drawRoundedRect(context, x, y, width, 46, 23, "rgba(8, 145, 178, 0.2)", "rgba(103, 232, 249, 0.28)")
    context.fillStyle = "#CFFAFE"
    context.fillText(option, x + 17, y + 30)
    x += width + 12
  }
}

function drawMetrics(context: CanvasRenderingContext2D, input: ExportManiaAnalysisImageInput) {
  const map = input.source.beatmap
  const metrics = [
    [input.labels.lnRatio, `${(input.result.lnRatio * 100).toFixed(1)}%`],
    [input.labels.reworkStar, input.result.star.toFixed(2)],
    [input.labels.bpm, map.bpm ? String(Math.round(map.bpm * input.options.speedRate)) : "—"],
    [input.labels.duration, formatDuration(map.totalLength, input.options.speedRate)],
  ]
  const gap = 18
  const cardWidth = (WIDTH - 192 - gap * 3) / 4
  metrics.forEach(([label, value], index) => {
    const x = 96 + index * (cardWidth + gap)
    drawRoundedRect(context, x, 500, cardWidth, 132, 22, "rgba(10,17,27,0.82)", "rgba(255,255,255,0.12)")
    context.fillStyle = "rgba(255,255,255,0.48)"
    setFont(context, 20, 620)
    context.fillText(label, x + 26, 542)
    context.fillStyle = "#F8FAFC"
    setFont(context, 36, 680, true)
    context.fillText(value, x + 26, 596)
  })
}

function drawSectionHeadings(context: CanvasRenderingContext2D, labels: ManiaAnalysisImageLabels) {
  context.fillStyle = "#F8FAFC"
  setFont(context, 30, 700, true)
  context.fillText("Etterna MSD", CHART_SIDE_INSET, 740)
  context.fillText(labels.patternSummary, 856, 740)
}

function drawRadar(context: CanvasRenderingContext2D, result: ManiaAnalysisResult, labels: ManiaAnalysisImageLabels) {
  const centerX = 414
  const centerY = 1080
  const radius = 205
  const values = SKILLS.map((skill) => result.etterna.values[skill])
  const maximum = Math.max(1, Math.max(...values) * 1.12)

  context.save()
  context.strokeStyle = "rgba(148,163,184,0.18)"
  context.lineWidth = 2
  for (let level = 1; level <= 5; level += 1) {
    drawPolygon(context, centerX, centerY, radius * level / 5, SKILLS.length)
    context.stroke()
  }
  SKILLS.forEach((_skill, index) => {
    const point = polarPoint(centerX, centerY, radius, index, SKILLS.length)
    context.beginPath()
    context.moveTo(centerX, centerY)
    context.lineTo(point.x, point.y)
    context.stroke()
  })

  context.beginPath()
  values.forEach((value, index) => {
    const point = polarPoint(centerX, centerY, radius * value / maximum, index, values.length)
    if (index === 0) context.moveTo(point.x, point.y)
    else context.lineTo(point.x, point.y)
  })
  context.closePath()
  context.fillStyle = "rgba(34, 211, 238, 0.18)"
  context.fill()
  context.strokeStyle = "#22D3EE"
  context.lineWidth = 5
  context.stroke()

  SKILLS.forEach((skill, index) => {
    const isSideLabel = skill === "Handstream" || skill === "Chordjack"
    const labelOffset = skill === "Stream" ? 56 : isSideLabel ? 38 : 48
    const point = polarPoint(centerX, centerY, radius + labelOffset, index, SKILLS.length)
    context.textAlign = Math.abs(point.x - centerX) < 20 ? "center" : point.x > centerX ? "left" : "right"
    context.fillStyle = "rgba(226,232,240,0.72)"
    setFont(context, 20, 560)
    context.fillText(labels.skillLabels[skill], point.x, point.y)
    context.fillStyle = "#F8FAFC"
    setFont(context, 22, 720, true)
    context.fillText(result.etterna.values[skill].toFixed(2), point.x, point.y + 29)
  })
  context.textAlign = "left"
  context.restore()
}

function drawPatternDonut(context: CanvasRenderingContext2D, result: ManiaAnalysisResult, labels: ManiaAnalysisImageLabels) {
  const centerX = 1186
  const centerY = 1080
  const outerRadius = 212
  const innerRadius = 132
  const distribution = buildPatternDistribution(result)
  const total = distribution.reduce((sum, item) => sum + item.amount, 0)
  let angle = -Math.PI / 2

  if (total > 0) {
    distribution.forEach((item, index) => {
      const slice = item.amount / total * Math.PI * 2
      context.beginPath()
      context.arc(centerX, centerY, outerRadius, angle, angle + slice)
      context.arc(centerX, centerY, innerRadius, angle + slice, angle, true)
      context.closePath()
      context.fillStyle = PATTERN_COLORS[index % PATTERN_COLORS.length]
      context.fill()

      const labelPoint = {
        x: centerX + Math.cos(angle + slice / 2) * (outerRadius + 34),
        y: centerY + Math.sin(angle + slice / 2) * (outerRadius + 34),
      }
      context.textAlign = labelPoint.x > centerX ? "left" : "right"
      context.fillStyle = "rgba(226,232,240,0.76)"
      setFont(context, 20, 600)
      context.fillText(item.name, labelPoint.x, labelPoint.y)
      angle += slice
    })
  } else {
    context.beginPath()
    context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
    context.arc(centerX, centerY, innerRadius, Math.PI * 2, 0, true)
    context.fillStyle = "rgba(148,163,184,0.14)"
    context.fill()
  }

  context.textAlign = "center"
  context.fillStyle = "rgba(226,232,240,0.48)"
  setFont(context, 20, 680, true)
  context.fillText(result.pattern?.modeTag || "4K", centerX, centerY - 10)
  context.fillStyle = "#F8FAFC"
  setFont(context, 30, 720, true)
  context.fillText(fitText(context, result.pattern?.category || labels.unknown, 260), centerX, centerY + 34)
  context.textAlign = "left"
}

function drawDifficultyGraph(context: CanvasRenderingContext2D, result: ManiaAnalysisResult, labels: ManiaAnalysisImageLabels) {
  const x = CHART_SIDE_INSET
  const y = 1530
  const width = WIDTH - CHART_SIDE_INSET * 2
  const height = 300
  context.fillStyle = "#F8FAFC"
  setFont(context, 30, 700, true)
  context.fillText(labels.difficultyGraph, x, y - 20)

  const points = result.graph.filter((point) => Number.isFinite(point.time) && Number.isFinite(point.difficulty))
  if (points.length < 2) return
  const horizontalPadding = 0
  const verticalPadding = 12
  const minTime = points[0].time
  const maxTime = Math.max(minTime + 1, points[points.length - 1].time)
  const maxDifficulty = Math.max(1, ...points.map((point) => point.difficulty)) * 1.08
  const getX = (time: number) => x + horizontalPadding + (time - minTime) / (maxTime - minTime) * (width - horizontalPadding * 2)
  const getY = (difficulty: number) => y + height - verticalPadding - difficulty / maxDifficulty * (height - verticalPadding * 2)
  const axisY = y + height - verticalPadding

  context.strokeStyle = "rgba(148,163,184,0.12)"
  context.lineWidth = 2
  for (let index = 1; index <= 4; index += 1) {
    const gridY = y + verticalPadding + (height - verticalPadding * 2) * index / 5
    context.beginPath()
    context.moveTo(x + horizontalPadding, gridY)
    context.lineTo(x + width - horizontalPadding, gridY)
    context.stroke()
  }

  context.strokeStyle = "rgba(148,163,184,0.2)"
  context.beginPath()
  context.moveTo(x + horizontalPadding, axisY)
  context.lineTo(x + width - horizontalPadding, axisY)
  context.stroke()

  const tickStep = getTimeTickStep(maxTime - minTime)
  const firstTick = Math.ceil(minTime / tickStep) * tickStep
  context.fillStyle = "rgba(226,232,240,0.42)"
  setFont(context, 16, 560)
  context.textAlign = "center"
  for (let tick = firstTick; tick <= maxTime; tick += tickStep) {
    const tickX = getX(tick)
    context.beginPath()
    context.moveTo(tickX, axisY)
    context.lineTo(tickX, axisY + 8)
    context.stroke()
    context.fillText(formatGraphTime(tick), tickX, y + height - 18)
  }
  context.textAlign = "left"

  context.beginPath()
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(getX(point.time), getY(point.difficulty))
    else context.lineTo(getX(point.time), getY(point.difficulty))
  })
  context.lineTo(getX(points[points.length - 1].time), axisY)
  context.lineTo(getX(points[0].time), axisY)
  context.closePath()
  const fill = context.createLinearGradient(0, y + verticalPadding, 0, axisY)
  fill.addColorStop(0, "rgba(34,211,238,0.38)")
  fill.addColorStop(1, "rgba(34,211,238,0.015)")
  context.fillStyle = fill
  context.fill()

  context.beginPath()
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(getX(point.time), getY(point.difficulty))
    else context.lineTo(getX(point.time), getY(point.difficulty))
  })
  context.strokeStyle = "#22D3EE"
  context.lineWidth = 5
  context.lineJoin = "round"
  context.stroke()
}

function drawFooter(context: CanvasRenderingContext2D, labels: ManiaAnalysisImageLabels) {
  context.fillStyle = "rgba(226,232,240,0.36)"
  setFont(context, 19, 560)
  context.fillText(labels.generatedBy, CHART_SIDE_INSET, 1938)
  context.textAlign = "right"
  context.fillText(new Date().toLocaleString(), WIDTH - CHART_SIDE_INSET, 1938)
  context.textAlign = "left"
}

function buildPatternDistribution(result: ManiaAnalysisResult) {
  const grouped = new Map<string, number>()
  for (const item of result.pattern?.topClusters ?? []) {
    if (!Number.isFinite(item.amount) || item.amount <= 0) continue
    grouped.set(item.name, (grouped.get(item.name) ?? 0) + item.amount)
  }
  return [...grouped].map(([name, amount]) => ({ amount, name })).sort((a, b) => b.amount - a.amount).slice(0, 6)
}

function drawPolygon(context: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, sides: number) {
  context.beginPath()
  for (let index = 0; index < sides; index += 1) {
    const point = polarPoint(centerX, centerY, radius, index, sides)
    if (index === 0) context.moveTo(point.x, point.y)
    else context.lineTo(point.x, point.y)
  }
  context.closePath()
}

function polarPoint(centerX: number, centerY: number, radius: number, index: number, total: number) {
  const angle = -Math.PI / 2 + index / total * Math.PI * 2
  return { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius }
}

function drawRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string, stroke?: string) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fillStyle = fill
  context.fill()
  if (stroke) {
    context.strokeStyle = stroke
    context.lineWidth = 2
    context.stroke()
  }
}

function setFont(context: CanvasRenderingContext2D, size: number, weight: number, heading = false) {
  context.font = `${weight} ${size}px ${heading ? "'Oxanium Variable'" : "'Figtree Variable'"}, sans-serif`
}

function fitText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (context.measureText(value).width <= maxWidth) return value
  let fitted = value
  while (fitted.length > 1 && context.measureText(`${fitted}…`).width > maxWidth) fitted = fitted.slice(0, -1)
  return `${fitted}…`
}

function formatDuration(seconds: number | null, rate: number) {
  if (!seconds) return "—"
  const adjusted = Math.round(seconds / rate)
  return `${Math.floor(adjusted / 60)}:${String(adjusted % 60).padStart(2, "0")}`
}

function formatNumber(value: number) {
  return Number(value.toFixed(2)).toString()
}

function getTimeTickStep(duration: number) {
  if (duration <= 90_000) return 15_000
  if (duration <= 180_000) return 30_000
  if (duration <= 420_000) return 60_000
  if (duration <= 900_000) return 120_000
  return 180_000
}

function formatGraphTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`
}

function splitEstimatedDifficulty(value: string) {
  const [primary, ...secondaryParts] = value.split(/\s*\|\|\s*/)
  return {
    primary,
    secondary: secondaryParts.join(" ").trim() || null,
  }
}

function sanitizeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim().slice(0, 80) || "analysis"
}

async function loadCover(primaryUrl: string | null, fallbackUrl: string) {
  if (primaryUrl) {
    try {
      return await loadImage(primaryUrl)
    } catch {
      // Fall back to the bundled cover when the upstream image disallows canvas access.
    }
  }
  try {
    return await loadImage(fallbackUrl)
  } catch {
    return null
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Unable to load cover"))
    image.src = url
  })
}

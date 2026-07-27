import { forwardRef, useId } from "react"
import type { Tournament } from "@/entities/tournament"
import { MAIN_STAGE_KEYS, type MainStageKey } from "../_shared/tournamentRoundStages"
import {
  getPerformanceMapLabel,
  getPlayerAvatar,
  getPlayerName,
  getPlayerTeamName,
  type PlayerPerformanceProfile,
} from "./playerPerformance"

export type PlayerPerformancePosterStageLabels = {
  compact: boolean
  games: string
  wins: string
}

type PlayerPerformancePosterProps = {
  profile: PlayerPerformanceProfile
  qualifierRank: number | null
  scopeLabel: string
  stageLabels: PlayerPerformancePosterStageLabels
  tournament: Tournament
}

const INK = "#202220"
const PAPER = "#f2f0eb"
const ROSE = "#9b6873"
const SLATE = "#687486"
const FONT_SANS = '"Helvetica Neue", "PingFang SC", Arial, sans-serif'
const FONT_DISPLAY = '"Oxanium Variable", "Trebuchet MS", "PingFang SC", sans-serif'
const FONT_SERIF = 'Georgia, "Songti SC", "STSong", serif'
const FONT_NUMERIC = '"DIN Alternate", Bahnschrift, "Arial Narrow", Arial, sans-serif'
const STAGE_SCORE_FLOOR = 990_000
const STAGE_SCORE_CEILING = 1_000_000
const STAGE_FULL_LABELS: Record<MainStageKey, string> = {
  ro32: "Round of 32",
  ro16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  f: "Finals",
  gf: "Grand Finals",
}

export const PlayerPerformancePoster = forwardRef<SVGSVGElement, PlayerPerformancePosterProps>(function PlayerPerformancePoster({ profile, qualifierRank, scopeLabel, stageLabels, tournament }, ref) {
  const id = useId().replaceAll(":", "")
  const avatar = getPlayerAvatar(profile)
  const playerName = getPlayerName(profile)
  const playerNameFontSize = getPlayerNameFontSize(playerName)
  const tournamentAcronym = tournament.acronym || tournament.name
  const stageRows = MAIN_STAGE_KEYS.map((key) => ({
    key,
    label: STAGE_FULL_LABELS[key],
    stage: profile.stages.find((item) => item.key === key),
  }))
  const bestGames = [...profile.entries].sort((a, b) => a.rank - b.rank || b.score - a.score).slice(0, 3)

  return (
    <svg aria-label={`${playerName} · ${tournament.name}`} className="block h-auto w-full" ref={ref} role="img" viewBox="0 0 340 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={`${id}-avatar`}><rect height="68" width="68" x="24" y="52" /></clipPath>
      </defs>

      <rect fill={PAPER} height="500" width="340" />
      <rect fill={ROSE} height="5" width="340" />
      <g fill="none">
        <circle cx="350" cy="105" opacity="0.3" r="175" stroke="#e2ded7" strokeWidth="18" />
        <circle cx="350" cy="105" opacity="0.055" r="140" stroke={ROSE} strokeWidth="10" />
        <circle cx="350" cy="105" opacity="0.42" r="105" stroke="#ddd9d2" strokeWidth="1.2" />
      </g>

      <text fontFamily={FONT_DISPLAY} fontSize="11" fontWeight="700" letterSpacing="1.9" x="24" y="32">
        <tspan fill={ROSE}>{truncate(tournamentAcronym, 10)}</tspan>
        <tspan fill={INK}> PLAYER PERFORMANCE</tspan>
      </text>
      {scopeLabel ? <text fill={SLATE} fontFamily={FONT_DISPLAY} fontSize="11" fontWeight="700" textAnchor="end" x="316" y="32">{truncate(scopeLabel, 8)}</text> : null}
      <rect fill={ROSE} height="68" width="68" x="24" y="52" />
      <text fill="#ffffff" fontFamily={FONT_DISPLAY} fontSize="28" fontWeight="700" textAnchor="middle" x="58" y="96">{initial(playerName)}</text>
      {avatar ? <image clipPath={`url(#${id}-avatar)`} height="68" href={avatar} preserveAspectRatio="xMidYMid slice" width="68" x="24" y="52" /> : null}

      <text fill={INK} fontFamily={FONT_SERIF} fontSize={playerNameFontSize} fontWeight="700" letterSpacing="-0.6" x="102" y="87">{playerName}</text>
      <text fill="#5b5b59" fontFamily={FONT_SERIF} fontSize="12" fontStyle="italic" x="104" y="111">{truncate(getPlayerTeamName(profile), 16)}</text>
      <text fill="#bbb7af" fontFamily={FONT_DISPLAY} fontSize="8" fontWeight="700" letterSpacing="1.2" textAnchor="end" x="316" y="74">QUAL.</text>
      <text fill={SLATE} fontFamily={FONT_NUMERIC} fontSize="25" fontWeight="700" textAnchor="end" x="316" y="97">{qualifierRank ? `#${qualifierRank}` : "—"}</text>

      {stageRows.map(({ key, label, stage }, index) => {
        const column = index % 2
        const row = Math.floor(index / 2)
        const x = 24 + column * 156
        const y = 155 + row * 56
        const scoreRatio = stage
          ? Math.max(0, Math.min((stage.averageScore - STAGE_SCORE_FLOOR) / (STAGE_SCORE_CEILING - STAGE_SCORE_FLOOR), 1))
          : 0
        const scoreWidth = stage ? (0.12 + scoreRatio * 0.88) * 136 : 0
        return (
          <g key={key}>
            <text fill={stage ? INK : "#989690"} fontFamily={FONT_DISPLAY} fontSize="12" fontWeight="700" x={x} y={y}>{label}</text>
            <text fill="#6b6b67" fontFamily={FONT_SANS} fontSize="9" fontWeight="400" x={x} y={y + 16}>
              {stage ? formatStageStats(stage.wins, stage.games, stageLabels) : "—"}
            </text>
            <text fill={stage ? SLATE : "#989690"} fontFamily={FONT_NUMERIC} fontSize="10" fontWeight="700" letterSpacing="0.3" textAnchor="end" x={x + 136} y={y + 16}>
              {stage ? `#${stage.averageRank.toFixed(1)}` : "—"}
            </text>
            <rect fill="#d8d4cc" height="2.5" width="136" x={x} y={y + 27} />
            {stage ? <rect fill={column === 0 ? ROSE : SLATE} height="2.5" width={scoreWidth} x={x} y={y + 27} /> : null}
          </g>
        )
      })}

      {bestGames.map((entry, index) => {
        const y = 336 + index * 48
        const stageLabel = STAGE_FULL_LABELS[entry.stageKey as MainStageKey] ?? entry.stageLabel
        const resultLabel = `${stageLabel} · ${getPerformanceMapLabel(entry)}`
        const map = entry.mapData.map
        const beatmapLabel = map ? `${map.artist} — ${map.title}` : ""
        const beatmapLines = wrapText(beatmapLabel, 54)
        return (
          <g key={`${entry.game_id}-${entry.side}`}>
            <text fill={ROSE} fontFamily={FONT_NUMERIC} fontSize="13" fontWeight="700" x="24" y={y}>0{index + 1}</text>
            <text fill={INK} fontFamily={FONT_DISPLAY} fontSize="13" fontWeight="700" x="48" y={y}>{resultLabel}</text>
            <text fontFamily={FONT_NUMERIC} fontWeight="700" textAnchor="end" x="316" y={y}>
              <tspan fill={SLATE} fontSize="13">#{entry.rank}</tspan>
              <tspan dx="8" fill={INK} fontSize="14">{formatNumber(entry.score)}</tspan>
            </text>
            {beatmapLines.map((line, lineIndex) => (
              <text fill="#87857f" fontFamily={FONT_SANS} fontSize="8.5" fontWeight="400" key={`${entry.game_id}-beatmap-${lineIndex}`} x="48" y={y + 15 + lineIndex * 10}>{line}</text>
            ))}
          </g>
        )
      })}

      <text fill="#666663" fontFamily={FONT_DISPLAY} fontSize="9" fontWeight="600" letterSpacing="1.4" x="24" y="483">JACKHOUSE.XYZ</text>
      <text fill="#666663" fontFamily={FONT_NUMERIC} fontSize="9" fontWeight="600" textAnchor="end" x="316" y="483">{profile.mapCount} MAPS / AVG RANK {profile.averageRank.toFixed(1)}</text>
    </svg>
  )
})

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value))
}

function formatStageStats(wins: number, games: number, labels: PlayerPerformancePosterStageLabels) {
  return labels.compact ? `${wins}W${games}G` : `${wins} ${labels.wins} / ${games} ${labels.games}`
}

function initial(value: string) {
  return Array.from(value.trim())[0]?.toUpperCase() || "?"
}

function getPlayerNameFontSize(value: string) {
  const widthUnits = Array.from(value).reduce((total, character) => {
    if (/[\u3000-\u9fff\uf900-\ufaff]/u.test(character)) return total + 1
    if (/[MW@%&#]/u.test(character)) return total + 0.85
    if (/[ilI1|'`]/u.test(character)) return total + 0.32
    if (/[._-]/u.test(character)) return total + 0.48
    return total + 0.58
  }, 0)
  if (widthUnits === 0) return 28
  return Math.max(15, Math.min(28, Math.floor((165 / widthUnits) * 10) / 10))
}

function truncate(value: string, maxLength: number) {
  const characters = Array.from(value)
  return characters.length > maxLength ? `${characters.slice(0, maxLength - 1).join("")}…` : value
}

function wrapText(value: string, maxLength: number) {
  if (!value) return []
  const words = value.split(/\s+/)
  const lines: string[] = []
  let line = ""

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word
    if (Array.from(nextLine).length <= maxLength || !line) {
      line = nextLine
    } else {
      lines.push(line)
      line = word
    }
  }

  if (line) lines.push(line)
  return lines
}

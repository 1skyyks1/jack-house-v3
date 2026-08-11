import { forwardRef, useId } from "react"
import {
  getPlayerAvatar,
  getPlayerName,
  getPlayerTeamName,
  type PlayerPerformanceProfile,
} from "./playerPerformance"

type PlayerCollectibleCardProps = {
  comparisonProfiles?: PlayerPerformanceProfile[]
  profile: PlayerPerformanceProfile
  tournament: { acronym: string; name: string }
}

const FONT_DISPLAY = '"Nunito Variable", "Helvetica Neue", "PingFang SC", sans-serif'
const FONT_SANS = '"Nunito Variable", "Helvetica Neue", "PingFang SC", Arial, sans-serif'
const ACCURACY_RELIABLE_GAME_COUNT = 8

export const PlayerCollectibleCard = forwardRef<SVGSVGElement, PlayerCollectibleCardProps>(function PlayerCollectibleCard({ comparisonProfiles, profile, tournament }, ref) {
  const id = useId().replaceAll(":", "")
  const avatar = getPlayerAvatar(profile)
  const playerName = getPlayerName(profile)
  const teamName = getPlayerTeamName(profile)
  const peers = comparisonProfiles?.length ? comparisonProfiles : [profile]
  const dominanceStars = getPercentileStars(
    getDominanceValue(profile.entries),
    peers.map((item) => getDominanceValue(item.entries)),
  )
  const accuracyStars = getStageNormalizedAccuracyStars(profile, peers)

  return (
    <svg
      aria-label={`${playerName} · ${tournament.name} collectible card`}
      className="block h-auto w-full"
      ref={ref}
      role="img"
      viewBox="0 0 360 500"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={`${id}-card`}><rect height="500" rx="18" width="360" /></clipPath>
        <clipPath id={`${id}-portrait`}><rect height="244" rx="7" width="244" x="58" y="48" /></clipPath>
        <linearGradient id={`${id}-frame`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f1f3f5" />
          <stop offset="0.28" stopColor="#89939f" />
          <stop offset="0.58" stopColor="#d8dde3" />
          <stop offset="0.82" stopColor="#727d89" />
          <stop offset="1" stopColor="#edf0f3" />
        </linearGradient>
        <linearGradient id={`${id}-portrait-fallback`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#243b59" />
          <stop offset="0.5" stopColor="#7f5069" />
          <stop offset="1" stopColor="#151c2d" />
        </linearGradient>
        <linearGradient id={`${id}-panel`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#15171a" />
          <stop offset="0.5" stopColor="#292b30" />
          <stop offset="1" stopColor="#17191c" />
        </linearGradient>
        <radialGradient id={`${id}-portrait-aura`} cx="50%" cy="42%" r="58%">
          <stop offset="0" stopColor="#858990" stopOpacity="0.25" />
          <stop offset="0.48" stopColor="#555960" stopOpacity="0.14" />
          <stop offset="1" stopColor="#202226" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} height="150%" width="140%" x="-20%" y="-25%">
          <feDropShadow dx="0" dy="3" floodColor="#050713" floodOpacity="0.46" stdDeviation="3" />
        </filter>
        <pattern height="8" id={`${id}-halftone`} patternUnits="userSpaceOnUse" width="8">
          <circle cx="2" cy="2" fill="#ffffff" fillOpacity="0.07" r="0.62" />
          <circle cx="2.45" cy="2.55" fill="#050607" fillOpacity="0.34" r="0.62" />
          <circle cx="6" cy="6" fill="#ffffff" fillOpacity="0.045" r="0.42" />
          <circle cx="6.35" cy="6.4" fill="#050607" fillOpacity="0.26" r="0.42" />
        </pattern>
      </defs>

      <g clipPath={`url(#${id}-card)`}>
        <rect fill="#0d1322" height="500" width="360" />
        <rect fill={`url(#${id}-frame)`} height="500" opacity="0.46" width="360" />
        <rect fill={`url(#${id}-panel)`} height="492" rx="14" width="352" x="4" y="4" />
        <ellipse cx="180" cy="173" fill={`url(#${id}-portrait-aura)`} rx="174" ry="182" />
        <rect fill={`url(#${id}-halftone)`} height="492" opacity="0.92" rx="14" width="352" x="4" y="4" />

        <g filter={`url(#${id}-shadow)`}>
          <rect fill={`url(#${id}-portrait-fallback)`} height="244" rx="7" width="244" x="58" y="48" />
          <text fill="#ffffff" fillOpacity="0.72" fontFamily={FONT_DISPLAY} fontSize="92" fontWeight="700" textAnchor="middle" x="180" y="201">
            {initial(playerName)}
          </text>
          {avatar ? (
            <image
              clipPath={`url(#${id}-portrait)`}
              height="244"
              href={avatar}
              preserveAspectRatio="xMidYMid slice"
              width="244"
              x="58"
              y="48"
            />
          ) : null}
          <rect fill="none" height="244" rx="7" stroke="#e1cb94" strokeOpacity="0.9" strokeWidth="2.2" width="244" x="58" y="48" />
        </g>

        <text fill="#f5f1e8" fontFamily={FONT_DISPLAY} fontSize={getPlayerNameFontSize(playerName)} fontWeight="800" textAnchor="middle" x="180" y="320">
          {playerName}
        </text>
        <text fill="#aeb5bf" fontFamily={FONT_DISPLAY} fontSize="10" fontWeight="750" letterSpacing="1" textAnchor="middle" x="180" y="337">{teamName}</text>
        <g fontFamily={FONT_DISPLAY} fontWeight="750">
          <text fill="#f5f1e8" fontSize="16" textAnchor="end" x="188" y="365">{Math.round(profile.tournamentRating)}</text>
          <text fill="#e5ce94" fontSize="10" letterSpacing="0.5" x="196" y="365">{profile.rank ? `#${profile.rank}` : "—"}</text>
        </g>

        <path d="M0 382H12L21 391H168M192 391H339L348 382H360" fill="none" stroke="#d8c38d" strokeOpacity="0.64" />
        <g filter={`url(#${id}-shadow)`}>
          <path d="M180 385L186 391L180 397L174 391Z" fill="#211f34" stroke="#e1cb94" strokeWidth="1.2" />
          <path d="M180 388L183 391L180 394L177 391Z" fill="#e1cb94" />
        </g>
        <SkillRow label="DOMINANCE" stars={dominanceStars} y={418} />
        <SkillRow label="ACCURACY" stars={accuracyStars} y={446} />

        <text fill="#d8c38d" fontFamily={FONT_DISPLAY} fontSize="8" fontWeight="700" letterSpacing="1.2" x="20" y="486">
          {tournament.acronym || tournament.name}
        </text>
        <text fill="#9ca7b9" fontFamily={FONT_DISPLAY} fontSize="8" fontWeight="700" letterSpacing="1" textAnchor="end" x="340" y="486">
          JH-{String(profile.player.id).padStart(4, "0")}
        </text>
        <g fill="#d8c38d" opacity="0.62">
          <circle cx="278" cy="482.5" r="1" />
          <circle cx="284" cy="482.5" r="1" />
          <circle cx="290" cy="482.5" r="1" />
        </g>
      </g>
      <rect fill="none" height="496" rx="17" stroke="#e4e9ee" strokeOpacity="0.3" strokeWidth="2.4" width="356" x="2" y="2" />
      <g fill="none" stroke="#fff" strokeOpacity="0.62" strokeWidth="1.2">
        <path d="M4 33V18Q4 4 18 4H34M326 4H342Q356 4 356 18V33" />
        <path d="M4 467V482Q4 496 18 496H34M326 496H342Q356 496 356 482V467" />
      </g>
    </svg>
  )
})

function SkillRow({ label, stars, y }: { label: string; stars: number; y: number }) {
  return (
    <g>
      <text fill="#f5f1e8" fontFamily={FONT_SANS} fontSize="10" fontWeight="750" letterSpacing="1.05" x="58" y={y + 3.5}>{label}</text>
      <g transform={`translate(194 ${y - 4})`}>
        {Array.from({ length: 10 }, (_, index) => (
          <Star amount={Math.max(0, Math.min(1, stars - index))} key={index} x={index * 11.8} />
        ))}
      </g>
    </g>
  )
}

function Star({ amount, x }: { amount: number; x: number }) {
  return (
    <g transform={`translate(${x} 0) scale(0.72)`}>
      {amount > 0 ? (
        <svg height="10.6" overflow="hidden" width={11.6 * amount} x="0" y="0">
          <path
            d="M6 0L7.65 3.65L11.6 4.05L8.65 6.7L9.45 10.6L6 8.6L2.55 10.6L3.35 6.7L0.4 4.05L4.35 3.65Z"
            fill="#e1cb94"
            opacity="0.96"
          />
        </svg>
      ) : null}
      <path
        d="M6 0L7.65 3.65L11.6 4.05L8.65 6.7L9.45 10.6L6 8.6L2.55 10.6L3.35 6.7L0.4 4.05L4.35 3.65Z"
        fill="none"
        opacity={amount > 0 ? 0.8 : 0.46}
        stroke="#e1cb94"
        strokeWidth="0.9"
      />
    </g>
  )
}

function initial(value: string) {
  return Array.from(value.trim())[0]?.toUpperCase() || "?"
}

function getDominanceValue(entries: PlayerPerformanceProfile["entries"]) {
  if (!entries.length) return 0
  return entries.reduce((total, entry) => (
    total + Math.max(0, entry.absolute_component - 1_000)
  ), 0) / entries.length
}

function getStageNormalizedAccuracyStars(profile: PlayerPerformanceProfile, comparisonProfiles: PlayerPerformanceProfile[]) {
  const profilesByPlayer = new Map(comparisonProfiles.map((item) => [item.player.id, item]))
  profilesByPlayer.set(profile.player.id, profile)

  const accuracyByStage = new Map<string, Map<number, { games: number; value: number }>>()
  for (const item of profilesByPlayer.values()) {
    const entriesByStage = new Map<string, PlayerPerformanceProfile["entries"]>()
    for (const entry of item.entries) {
      entriesByStage.set(entry.stageKey, [...(entriesByStage.get(entry.stageKey) ?? []), entry])
    }
    for (const [stageKey, entries] of entriesByStage) {
      const stageValues = accuracyByStage.get(stageKey) ?? new Map()
      stageValues.set(item.player.id, {
        games: entries.length,
        value: average(entries.map((entry) => Math.max(0, entry.match_component))),
      })
      accuracyByStage.set(stageKey, stageValues)
    }
  }

  let games = 0
  let weightedPercentile = 0
  for (const stageValues of accuracyByStage.values()) {
    const playerValue = stageValues.get(profile.player.id)
    if (!playerValue) continue
    const percentile = getPercentile(
      playerValue.value,
      Array.from(stageValues.values(), (item) => item.value),
    )
    games += playerValue.games
    weightedPercentile += percentile * playerValue.games
  }

  if (!games) return 7.5
  // Match the rating model's high-reliability threshold and pull smaller samples
  // toward the neutral midpoint instead of letting a few early 999s dominate the card.
  const neutralGames = Math.max(0, ACCURACY_RELIABLE_GAME_COUNT - games)
  const normalizedAccuracy = (weightedPercentile + neutralGames * 0.5) / (games + neutralGames)
  return getStarsFromPercentile(normalizedAccuracy)
}

function getPercentileStars(value: number, values: number[]) {
  return getStarsFromPercentile(getPercentile(value, values))
}

function getPercentile(value: number, values: number[]) {
  const sortedValues = values.filter(Number.isFinite).sort((left, right) => left - right)
  if (sortedValues.length <= 1) return 0.5
  const below = sortedValues.filter((item) => item < value).length
  const equal = sortedValues.filter((item) => item === value).length
  return (below + Math.max(0, equal - 1) / 2) / (sortedValues.length - 1)
}

function getStarsFromPercentile(percentile: number) {
  return Math.max(5, Math.min(10, Math.round((5 + percentile * 5) * 2) / 2))
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

function getPlayerNameFontSize(value: string) {
  const length = Array.from(value).length
  if (length <= 12) return 23
  if (length <= 16) return 20
  return 17
}

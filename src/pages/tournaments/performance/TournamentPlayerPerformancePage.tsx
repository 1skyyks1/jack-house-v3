import { useEffect, useMemo, useRef, useState } from "react"
import { CaretDown, DownloadSimple } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useTournamentDetailQuery, useTournamentPerformanceQuery, useTournamentQualRankingQuery, useTournamentRoundsQuery } from "@/entities/tournament"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AppAlert, DetailPageSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { TournamentBreadcrumb } from "../_shared/TournamentBreadcrumb"
import { groupRoundsByMainStage } from "../_shared/tournamentRoundStages"
import { getTournamentPublicPath } from "../_shared/tournamentVisuals"
import { downloadSvgAsPng } from "./exportSvg"
import { PlayerPerformancePoster } from "./PlayerPerformancePoster"
import { buildPlayerPerformanceProfiles, getPlayerName, getPlayerTeamName } from "./playerPerformance"

export function TournamentPlayerPerformancePage() {
  const { i18n, t } = useTranslation()
  const { playerId, tid } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const posterRef = useRef<SVGSVGElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isPlayerPickerOpen, setIsPlayerPickerOpen] = useState(false)
  const tournamentQuery = useTournamentDetailQuery(tid)
  const performanceQuery = useTournamentPerformanceQuery(tid)
  const qualifierRankingQuery = useTournamentQualRankingQuery(tid)
  const roundsQuery = useTournamentRoundsQuery(tid)
  const roundGroups = useMemo(() => groupRoundsByMainStage(roundsQuery.data ?? []), [roundsQuery.data])
  const aggregationGroups = useMemo(() => roundGroups.map((group) => ({
    key: group.key,
    label: group.label,
    roundIds: group.rounds.map((round) => round.id),
  })), [roundGroups])
  const profiles = useMemo(
    () => buildPlayerPerformanceProfiles(performanceQuery.data, aggregationGroups),
    [aggregationGroups, performanceQuery.data],
  )
  const selectedPlayer = profiles.find((profile) => String(profile.player.id) === playerId) ?? profiles[0]
  const selectedProfile = selectedPlayer
  const qualifierTeamIndex = (qualifierRankingQuery.data ?? []).findIndex((team) => team.id === selectedPlayer?.team.id)
  const qualifierTeam = qualifierTeamIndex >= 0 ? qualifierRankingQuery.data?.[qualifierTeamIndex] : undefined
  const qualifierRank = qualifierTeam ? qualifierTeam.qual_rank ?? qualifierTeamIndex + 1 : null
  const tournament = tournamentQuery.data
  const publicPath = tournament ? getTournamentPublicPath(tournament) : `/t/${tid ?? ""}`
  const selectedPath = selectedPlayer ? `${publicPath}/performance/${selectedPlayer.player.id}` : `${publicPath}/performance`
  const stageLabels = {
    compact: !i18n.resolvedLanguage?.toLowerCase().startsWith("zh"),
    games: t("tournament.playerPerformance.games"),
    wins: t("tournament.playerPerformance.wins"),
  }

  useEffect(() => {
    if (!tournament || !selectedPlayer || (location.pathname === selectedPath && !location.search)) return
    navigate(`${selectedPath}${location.hash}`, { replace: true })
  }, [location.hash, location.pathname, location.search, navigate, selectedPath, selectedPlayer, tournament])

  if (tournamentQuery.isError || performanceQuery.isError || qualifierRankingQuery.isError || roundsQuery.isError) {
    return <PageState title={t("tournament.playerPerformance.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? performanceQuery.error ?? qualifierRankingQuery.error ?? roundsQuery.error)} />
  }

  if (tournamentQuery.isLoading || performanceQuery.isLoading || qualifierRankingQuery.isLoading || roundsQuery.isLoading || !tournament) {
    return <DetailPageSkeleton />
  }

  const handleExport = async () => {
    if (!posterRef.current || !selectedProfile) return
    setIsExporting(true)
    try {
      const safePlayerName = getPlayerName(selectedProfile).replace(/[^a-z0-9\u4e00-\u9fff_-]+/gi, "-")
      await downloadSvgAsPng(posterRef.current, `${tournament.acronym || tournament.id}-${safePlayerName}-performance.png`)
      toast.success(t("tournament.playerPerformance.exported"))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <TournamentBreadcrumb current={t("tournament.common.performance")} tournament={tournament} />

      {profiles.length === 0 || !selectedPlayer ? (
        <AppAlert title={t("tournament.playerPerformance.emptyTitle")}>{t("tournament.playerPerformance.emptyDescription")}</AppAlert>
      ) : (
        <>
          <div className="flex w-full flex-wrap items-center justify-center gap-2">
              <Popover open={isPlayerPickerOpen} onOpenChange={setIsPlayerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    aria-expanded={isPlayerPickerOpen}
                    aria-label={t("tournament.playerPerformance.selectPlayer")}
                    className="w-full justify-between font-normal sm:w-[13rem]"
                    role="combobox"
                    variant="outline"
                  >
                    <span className="truncate">{getPlayerName(selectedPlayer)}</span>
                    <CaretDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
                  <Command>
                    <CommandInput placeholder={t("tournament.playerPerformance.searchPlayer")} />
                    <CommandList>
                      <CommandEmpty>{t("tournament.playerPerformance.noMatchingPlayer")}</CommandEmpty>
                      <CommandGroup>
                        {profiles.map((profile) => {
                          const name = getPlayerName(profile)
                          const team = getPlayerTeamName(profile)
                          return (
                            <CommandItem
                              data-checked={profile.player.id === selectedPlayer.player.id}
                              key={profile.player.id}
                              onSelect={() => {
                                setIsPlayerPickerOpen(false)
                                navigate(`${publicPath}/performance/${profile.player.id}`)
                              }}
                              value={`${name} ${team} ${profile.player.id}`}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium">{name}</div>
                                <div className="truncate text-xs text-muted-foreground">{team}</div>
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button className="w-full sm:w-auto" disabled={isExporting || !selectedProfile} onClick={handleExport}><DownloadSimple />{isExporting ? t("tournament.playerPerformance.exporting") : t("tournament.playerPerformance.exportPng")}</Button>
          </div>

          <section className="mx-auto w-full max-w-[476px] overflow-hidden rounded-2xl bg-[#071426] shadow-2xl ring-1 ring-white/10">
            <PlayerPerformancePoster
              profile={selectedProfile}
              qualifierRank={qualifierRank}
              ref={posterRef}
              scopeLabel=""
              stageLabels={stageLabels}
              tournament={tournament}
            />
          </section>
        </>
      )}
    </main>
  )
}

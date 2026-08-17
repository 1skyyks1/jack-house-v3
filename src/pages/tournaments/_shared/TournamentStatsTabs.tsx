import { ChartLineUp, ListNumbers } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TournamentStatsTabsProps = {
  active: "mapper-leaderboard" | "ratings" | "score-leaderboard"
  publicTournamentPath: string
}

export function TournamentStatsTabs({ active, publicTournamentPath }: TournamentStatsTabsProps) {
  const { t } = useTranslation()

  return (
    <Tabs className="w-full sm:w-auto" value={active}>
      <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:min-w-80">
        <TabsTrigger asChild value="score-leaderboard">
          <Link to={`${publicTournamentPath}/leaderboard`}><ListNumbers />{t("tournament.common.scoreLeaderboard")}</Link>
        </TabsTrigger>
        <TabsTrigger asChild value="ratings">
          <Link to={`${publicTournamentPath}/ratings`}><ChartLineUp />{t("tournament.common.performance")}</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

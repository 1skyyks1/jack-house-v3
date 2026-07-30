import { ArrowClockwise, Calculator, LockKey, LockKeyOpen } from "@phosphor-icons/react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  useCalculateTournamentRatingsMutation,
  useFinalizeTournamentRatingsMutation,
  useTournamentDetailQuery,
  useTournamentPerformanceQuery,
  useTournamentRatingsManageQuery,
  useUnlockTournamentRatingsMutation,
} from "@/entities/tournament"
import { AdminPage } from "@/features/admin-shell"
import { AppAlert, getErrorMessage, MutationErrorAlert, PageSkeleton, PageState } from "@/shared/components"
import { formatDate } from "@/shared/lib/date"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

export function AdminTournamentRatingsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentId = tid ?? ""
  const tournamentQuery = useTournamentDetailQuery(tid)
  const manageQuery = useTournamentRatingsManageQuery(tid)
  const performanceQuery = useTournamentPerformanceQuery(tid)
  const calculateMutation = useCalculateTournamentRatingsMutation(tournamentId)
  const finalizeMutation = useFinalizeTournamentRatingsMutation(tournamentId)
  const unlockMutation = useUnlockTournamentRatingsMutation(tournamentId)
  const mutationError = calculateMutation.error ?? finalizeMutation.error ?? unlockMutation.error

  if (tournamentQuery.isError || manageQuery.isError || performanceQuery.isError) {
    return <PageState title={t("tournament.admin.ratings.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? manageQuery.error ?? performanceQuery.error)} />
  }
  if (tournamentQuery.isLoading || manageQuery.isLoading || performanceQuery.isLoading) {
    return <AdminPage breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.admin.common.ratings")} tournament={tournamentQuery.data} tournamentId={tid} />}><PageSkeleton /></AdminPage>
  }

  const tournament = tournamentQuery.data
  const status = manageQuery.data
  const snapshot = status?.snapshot
  const ratings = performanceQuery.data?.ratings ?? []
  const publicPath = tournament ? getTournamentPublicPath(tournament) : `/t/${tournamentId}`
  const isMutating = calculateMutation.isPending || finalizeMutation.isPending || unlockMutation.isPending

  const calculate = () => calculateMutation.mutate(undefined, {
    onSuccess: () => toast.success(t(snapshot ? "tournament.admin.ratings.recalculated" : "tournament.admin.ratings.calculated")),
  })
  const finalize = () => finalizeMutation.mutate(undefined, {
    onSuccess: () => toast.success(t("tournament.admin.ratings.finalized")),
  })
  const unlock = () => unlockMutation.mutate(undefined, {
    onSuccess: () => toast.success(t("tournament.admin.ratings.unlocked")),
  })

  return (
    <AdminPage
      actions={<Button asChild size="sm" variant="outline"><Link to={`${publicPath}/ratings`}>{t("tournament.admin.common.view")}</Link></Button>}
      breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.admin.common.ratings")} tournament={tournament} tournamentId={tid} />}
    >
      {mutationError ? <MutationErrorAlert error={mutationError} title={t("tournament.admin.ratings.operationFailed")} /> : null}

      <AppAlert
        title={snapshot?.is_final ? t("tournament.admin.ratings.finalTitle") : snapshot ? t("tournament.admin.ratings.publishedTitle") : t("tournament.admin.ratings.title")}
        tone={status?.is_stale ? "warning" : snapshot ? "success" : "default"}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p>{status?.is_stale
              ? t("tournament.admin.ratings.staleDescription")
              : snapshot
              ? t("tournament.admin.ratings.publishedDescription", { games: snapshot.game_count, players: snapshot.player_count, time: formatDate(snapshot.calculated_at) })
              : t("tournament.admin.ratings.readyDescription", { games: status?.current_game_count ?? 0 })}</p>
            {snapshot ? <p className="text-xs text-muted-foreground">{snapshot.model_version}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!status?.can_calculate || isMutating} size="sm" type="button" variant={snapshot ? "outline" : "default"} onClick={calculate}>
              {snapshot ? <ArrowClockwise /> : <Calculator />}
              {snapshot ? t("tournament.admin.ratings.recalculate") : t("tournament.admin.ratings.calculate")}
            </Button>
            {snapshot?.is_final ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isMutating} size="sm" type="button" variant="outline"><LockKeyOpen />{t("tournament.admin.ratings.unlock")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("tournament.admin.ratings.unlockTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("tournament.admin.ratings.unlockDescription")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={unlock}>{t("tournament.admin.ratings.unlock")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : snapshot && !status?.is_stale ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isMutating} size="sm" type="button"><LockKey />{t("tournament.admin.ratings.finalize")}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("tournament.admin.ratings.finalizeTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("tournament.admin.ratings.finalizeDescription")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={finalize}>{t("tournament.admin.ratings.finalize")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        </div>
      </AppAlert>

      {ratings.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>{t("tournament.admin.ratings.player")}</TableHead>
              <TableHead className="text-right">{t("tournament.admin.ratings.rating")}</TableHead>
              <TableHead className="text-right">{t("tournament.admin.ratings.averageJpp")}</TableHead>
              <TableHead className="text-right">{t("tournament.admin.ratings.games")}</TableHead>
              <TableHead className="text-right">{t("tournament.admin.ratings.reliability")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>{ratings.map(rating => (
              <TableRow key={rating.player.id}>
                <TableCell className="font-medium">{rating.rank}</TableCell>
                <TableCell>
                  <Link className="font-medium hover:underline" to={`${publicPath}/ratings?player=${rating.player.id}`}>
                    {rating.player.user_name_snapshot || rating.player.user?.user_name || `Player ${rating.player.id}`}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">{Math.round(rating.tournament_rating)}</TableCell>
                <TableCell className="text-right font-mono">{Math.round(rating.average_jpp)}</TableCell>
                <TableCell className="text-right">{rating.game_count}</TableCell>
                <TableCell className="text-right"><Badge variant="outline">{t(`tournament.admin.ratings.reliabilityLevels.${rating.reliability}`)}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      ) : null}
    </AdminPage>
  )
}

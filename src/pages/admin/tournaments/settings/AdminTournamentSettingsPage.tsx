import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Eye } from "@phosphor-icons/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useTournamentDetailQuery, useUpdateTournamentMutation } from "@/entities/tournament"
import { TournamentSettingsForm } from "@/features/tournament/admin/TournamentSettingsForm"
import {
  toTournamentMutationRequest,
  toTournamentSettingsFormValues,
  tournamentSettingsDefaultValues,
  tournamentSettingsSchema,
  type TournamentSettingsFormValues,
} from "@/features/tournament/admin/TournamentSettingsFormModel"
import { AdminPage } from "@/features/admin-shell"
import { Button } from "@/components/ui/button"
import { AppAlert, getErrorMessage, PageState } from "@/shared/components"

export function AdminTournamentSettingsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const updateMutation = useUpdateTournamentMutation(tid ?? "")
  const form = useForm<TournamentSettingsFormValues>({
    defaultValues: tournamentSettingsDefaultValues,
    resolver: zodResolver(tournamentSettingsSchema),
  })

  useEffect(() => {
    if (tournamentQuery.data) {
      form.reset(toTournamentSettingsFormValues(tournamentQuery.data))
    }
  }, [form, tournamentQuery.data])

  const submit = form.handleSubmit((values) => {
    if (!tid) return
    updateMutation.mutate(toTournamentMutationRequest(values), {
      onSuccess: () => {
        toast.success(t("tournament.admin.form.settingsSaved"))
      },
    })
  })

  if (tournamentQuery.isError) {
    return <PageState title={t("tournament.admin.common.tournamentLoadFailed")} description={getErrorMessage(tournamentQuery.error)} />
  }

  return (
    <AdminPage
      actions={(
        <>
          <Button asChild type="button" variant="outline">
            <Link to="/admin/tournaments">
              <ArrowLeft className="size-4" />
              {t("tournament.admin.common.back")}
            </Link>
          </Button>
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={`/t/${tournamentQuery.data.acronym || tournamentQuery.data.id}`}>
                <Eye className="size-4" />
                {t("tournament.admin.common.view")}
              </Link>
            </Button>
          ) : null}
        </>
      )}
    >
      {tournamentQuery.isLoading ? <PageState title={t("tournament.admin.common.loadingTournament")} description={t("tournament.admin.form.loadingSettings")} /> : null}
      {!tournamentQuery.isLoading && !tournamentQuery.data ? <AppAlert title={t("tournament.admin.common.tournamentNotFound")} /> : null}
      {tournamentQuery.data ? (
        <TournamentSettingsForm
          error={updateMutation.error}
          errorTitle={t("tournament.admin.form.saveFailed")}
          form={form}
          isPending={updateMutation.isPending}
          onSubmit={submit}
          pendingLabel={t("tournament.admin.form.saving")}
          submitLabel={t("tournament.admin.form.saveSettings")}
        />
      ) : null}
    </AdminPage>
  )
}

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, FloppyDisk } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useCreateTournamentMutation } from "@/entities/tournament"
import { TournamentSettingsForm } from "@/features/tournament/admin/TournamentSettingsForm"
import {
  toTournamentMutationRequest,
  tournamentSettingsDefaultValues,
  tournamentSettingsSchema,
  type TournamentSettingsFormValues,
} from "@/features/tournament/admin/TournamentSettingsFormModel"
import { AdminPage } from "@/features/admin-shell"
import { Button } from "@/components/ui/button"

export function AdminTournamentNewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const formId = "admin-tournament-new-form"
  const createMutation = useCreateTournamentMutation()
  const form = useForm<TournamentSettingsFormValues>({
    defaultValues: tournamentSettingsDefaultValues,
    resolver: zodResolver(tournamentSettingsSchema),
  })

  const submit = form.handleSubmit((values) => {
    createMutation.mutate(toTournamentMutationRequest(values), {
      onSuccess: () => {
        toast.success(t("tournament.admin.form.created"))
        navigate("/admin/tournaments")
      },
    })
  })

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
          <Button disabled={createMutation.isPending} form={formId} type="submit">
            <FloppyDisk className="size-4" weight="bold" />
            {createMutation.isPending ? t("tournament.admin.form.createPending") : t("tournament.admin.form.createSubmit")}
          </Button>
        </>
      )}
    >
      <TournamentSettingsForm
        error={createMutation.error}
        errorTitle={t("tournament.admin.form.createFailed")}
        form={form}
        formId={formId}
        onSubmit={submit}
      />
    </AdminPage>
  )
}

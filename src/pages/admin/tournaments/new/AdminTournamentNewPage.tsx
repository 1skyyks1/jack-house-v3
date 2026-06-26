import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "@phosphor-icons/react"
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
        <Button asChild type="button" variant="outline">
          <Link to="/admin/tournaments">
            <ArrowLeft className="size-4" />
            {t("tournament.admin.common.back")}
          </Link>
        </Button>
      )}
    >
      <TournamentSettingsForm
        error={createMutation.error}
        errorTitle={t("tournament.admin.form.createFailed")}
        form={form}
        isPending={createMutation.isPending}
        onSubmit={submit}
        pendingLabel={t("tournament.admin.form.createPending")}
        submitLabel={t("tournament.admin.form.createSubmit")}
      />
    </AdminPage>
  )
}

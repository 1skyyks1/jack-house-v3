import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, FileText, FloppyDisk, IdentificationBadge } from "@phosphor-icons/react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { useTournamentDetailQuery, useUpdateTournamentMutation, useUploadTournamentDefaultTeamAvatarMutation } from "@/entities/tournament"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppAlert, FormPageSkeleton, getErrorMessage, PageState } from "@/shared/components"
import { TeamFlag } from "@/pages/tournaments/_shared/TeamFlag"
import { getTournamentPublicPath } from "@/pages/tournaments/_shared/tournamentVisuals"
import { AdminTournamentBreadcrumb } from "../_shared/AdminTournamentBreadcrumb"

export function AdminTournamentSettingsPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const formId = "admin-tournament-settings-form"
  const tournamentQuery = useTournamentDetailQuery(tid)
  const updateMutation = useUpdateTournamentMutation(tid ?? "")
  const uploadDefaultTeamAvatarMutation = useUploadTournamentDefaultTeamAvatarMutation(tid ?? "")
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
      onSuccess: (tournament) => {
        form.reset(toTournamentSettingsFormValues(tournament))
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
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={getTournamentPublicPath(tournamentQuery.data)}>
                <Eye className="size-4" />
                {t("tournament.admin.common.view")}
              </Link>
            </Button>
          ) : null}
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={`/admin/tournaments/${tid}/content`}>
                <FileText className="size-4" />
                {t("tournament.admin.common.content")}
              </Link>
            </Button>
          ) : null}
          {tournamentQuery.data ? (
            <Button asChild type="button" variant="outline">
              <Link to={`/admin/tournaments/${tid}/staff`}>
                <IdentificationBadge className="size-4" />
                {t("tournament.admin.common.staff")}
              </Link>
            </Button>
          ) : null}
          {tournamentQuery.data ? (
            <Button disabled={updateMutation.isPending} form={formId} type="submit">
              <FloppyDisk className="size-4" weight="bold" />
              {updateMutation.isPending ? t("tournament.admin.form.saving") : t("tournament.admin.form.saveSettings")}
            </Button>
          ) : null}
        </>
      )}
      breadcrumb={<AdminTournamentBreadcrumb current={t("tournament.admin.common.settings")} tournament={tournamentQuery.data} tournamentId={tid} />}
    >
      {tournamentQuery.isLoading ? <FormPageSkeleton /> : null}
      {!tournamentQuery.isLoading && !tournamentQuery.data ? <AppAlert title={t("tournament.admin.common.tournamentNotFound")} /> : null}
      {tournamentQuery.data ? (
        <div className="space-y-4">
          <DefaultTeamAvatarPanel
            isUploading={uploadDefaultTeamAvatarMutation.isPending}
            tournamentName={tournamentQuery.data.name}
            value={tournamentQuery.data.default_team_avatar}
            onUpload={(file) => {
              uploadDefaultTeamAvatarMutation.mutate(file, {
                onSuccess: (tournament) => {
                  form.reset(toTournamentSettingsFormValues(tournament))
                  toast.success(t("tournament.admin.form.defaultTeamAvatarUploaded"))
                },
              })
            }}
          />
          {uploadDefaultTeamAvatarMutation.error ? <AppAlert title={t("tournament.admin.form.defaultTeamAvatarUploadFailed")} tone="destructive">{getErrorMessage(uploadDefaultTeamAvatarMutation.error)}</AppAlert> : null}
          <TournamentSettingsForm
            error={updateMutation.error}
            errorTitle={t("tournament.admin.form.saveFailed")}
            form={form}
            formId={formId}
            onSubmit={submit}
          />
        </div>
      ) : null}
    </AdminPage>
  )
}

function DefaultTeamAvatarPanel({
  isUploading,
  onUpload,
  tournamentName,
  value,
}: {
  isUploading: boolean
  onUpload: (file: File) => void
  tournamentName: string
  value?: string | null
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tournament.admin.form.sections.defaultTeamAvatar")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <TeamFlag className="h-16" name={tournamentName} src={value} />
          <div>
            <p className="text-sm font-medium">{t("tournament.admin.form.fields.defaultTeamAvatar")}</p>
            <p className="text-xs text-muted-foreground">{t("tournament.admin.form.defaultTeamAvatarDescription")}</p>
          </div>
        </div>
        <div className="grid w-full gap-2 sm:max-w-xs">
          <Label htmlFor="tournament-default-team-avatar">{t("tournament.admin.form.fields.defaultTeamAvatar")}</Label>
          <Input
            accept="image/jpeg,image/png,image/gif,image/webp"
            disabled={isUploading}
            id="tournament-default-team-avatar"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.currentTarget.value = ""
              if (file) onUpload(file)
            }}
            type="file"
          />
        </div>
      </CardContent>
    </Card>
  )
}

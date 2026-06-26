import type { ReactNode } from "react"
import type { UseFormReturn } from "react-hook-form"
import { FloppyDisk } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormFieldError, MutationErrorAlert } from "@/shared/components"
import type { TournamentSettingsFormValues } from "./TournamentSettingsFormModel"

type TournamentSettingsFormProps = {
  error?: unknown
  errorTitle: string
  form: UseFormReturn<TournamentSettingsFormValues>
  isPending: boolean
  onSubmit: () => void
  pendingLabel: string
  submitLabel: string
}

export function TournamentSettingsForm({
  error,
  errorTitle,
  form,
  isPending,
  onSubmit,
  pendingLabel,
  submitLabel,
}: TournamentSettingsFormProps) {
  const { t } = useTranslation()

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? <MutationErrorAlert error={error} title={errorTitle} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("tournament.admin.form.sections.basics")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field className="md:col-span-2" error={form.formState.errors.name?.message} id="tournament-name" label={t("tournament.admin.form.fields.name")}>
            <Input autoComplete="off" id="tournament-name" placeholder={t("tournament.admin.form.placeholders.name")} {...form.register("name")} />
          </Field>
          <Field error={form.formState.errors.acronym?.message} id="tournament-acronym" label={t("tournament.admin.form.fields.acronym")}>
            <Input autoComplete="off" id="tournament-acronym" placeholder={t("tournament.admin.form.placeholders.acronym")} {...form.register("acronym")} />
          </Field>
          <Field error={form.formState.errors.banner?.message} id="tournament-banner" label={t("tournament.admin.form.fields.banner")}>
            <Input autoComplete="off" id="tournament-banner" placeholder={t("tournament.admin.form.placeholders.banner")} {...form.register("banner")} />
          </Field>
          <Field className="md:col-span-2" error={form.formState.errors.desc_zh?.message} id="tournament-desc-zh" label={t("tournament.admin.form.fields.descZh")}>
            <Textarea id="tournament-desc-zh" rows={3} {...form.register("desc_zh")} />
          </Field>
          <Field className="md:col-span-2" error={form.formState.errors.desc_en?.message} id="tournament-desc-en" label={t("tournament.admin.form.fields.descEn")}>
            <Textarea id="tournament-desc-en" rows={3} {...form.register("desc_en")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tournament.admin.form.sections.registration")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field error={form.formState.errors.reg_start?.message} id="tournament-reg-start" label={t("tournament.admin.form.fields.regStart")}>
            <Input id="tournament-reg-start" type="datetime-local" {...form.register("reg_start")} />
          </Field>
          <Field error={form.formState.errors.reg_end?.message} id="tournament-reg-end" label={t("tournament.admin.form.fields.regEnd")}>
            <Input id="tournament-reg-end" type="datetime-local" {...form.register("reg_end")} />
          </Field>
          <Field error={form.formState.errors.qual_start?.message} id="tournament-qual-start" label={t("tournament.admin.form.fields.qualStart")}>
            <Input id="tournament-qual-start" type="datetime-local" {...form.register("qual_start")} />
          </Field>
          <Field error={form.formState.errors.qual_end?.message} id="tournament-qual-end" label={t("tournament.admin.form.fields.qualEnd")}>
            <Input id="tournament-qual-end" type="datetime-local" {...form.register("qual_end")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tournament.admin.form.sections.competition")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field error={form.formState.errors.team_size_min?.message} id="tournament-team-size-min" label={t("tournament.admin.form.fields.teamSizeMin")}>
            <Input id="tournament-team-size-min" type="number" {...form.register("team_size_min", { valueAsNumber: true })} />
          </Field>
          <Field error={form.formState.errors.team_size_max?.message} id="tournament-team-size-max" label={t("tournament.admin.form.fields.teamSizeMax")}>
            <Input id="tournament-team-size-max" type="number" {...form.register("team_size_max", { valueAsNumber: true })} />
          </Field>
          <Field error={form.formState.errors.qual_top_n?.message} id="tournament-qual-top-n" label={t("tournament.admin.form.fields.qualTopN")}>
            <Input id="tournament-qual-top-n" type="number" {...form.register("qual_top_n", { valueAsNumber: true })} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={isPending} type="submit">
          <FloppyDisk className="size-4" weight="bold" />
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function Field({ children, className, error, id, label }: { children: ReactNode; className?: string; error?: string; id: string; label: string }) {
  return (
    <div className={className}>
      <Label className="mb-2 block" htmlFor={id}>
        {label}
      </Label>
      {children}
      <FormFieldError message={error} />
    </div>
  )
}

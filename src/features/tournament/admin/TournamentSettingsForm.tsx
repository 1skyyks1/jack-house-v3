import type { ReactNode } from "react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateTimePicker } from "@/shared/components/DateTimePicker"
import { FormFieldError, MutationErrorAlert } from "@/shared/components"
import { QUAL_RANK_MODE_RANK_SUM, QUAL_RANK_MODE_TOTAL_SCORE } from "@/entities/tournament"
import type { TournamentSettingsFormValues } from "./TournamentSettingsFormModel"

type TournamentSettingsFormProps = {
  error?: unknown
  errorTitle: string
  form: UseFormReturn<TournamentSettingsFormValues>
  formId?: string
  onSubmit: () => void
}

export function TournamentSettingsForm({
  error,
  errorTitle,
  form,
  formId,
  onSubmit,
}: TournamentSettingsFormProps) {
  const { t } = useTranslation()
  const regStart = useWatch({ control: form.control, name: "reg_start" })
  const regEnd = useWatch({ control: form.control, name: "reg_end" })
  const qualStart = useWatch({ control: form.control, name: "qual_start" })
  const qualEnd = useWatch({ control: form.control, name: "qual_end" })

  return (
    <form className="space-y-4" id={formId} onSubmit={onSubmit}>
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
            <DateTimePicker
              aria-invalid={Boolean(form.formState.errors.reg_start)}
              id="tournament-reg-start"
              placeholder={t("tournament.admin.form.fields.regStart")}
              value={regStart}
              onChange={(value) => form.setValue("reg_start", value, { shouldDirty: true, shouldValidate: true })}
            />
          </Field>
          <Field error={form.formState.errors.reg_end?.message} id="tournament-reg-end" label={t("tournament.admin.form.fields.regEnd")}>
            <DateTimePicker
              aria-invalid={Boolean(form.formState.errors.reg_end)}
              id="tournament-reg-end"
              placeholder={t("tournament.admin.form.fields.regEnd")}
              value={regEnd}
              onChange={(value) => form.setValue("reg_end", value, { shouldDirty: true, shouldValidate: true })}
            />
          </Field>
          <Field error={form.formState.errors.qual_start?.message} id="tournament-qual-start" label={t("tournament.admin.form.fields.qualStart")}>
            <DateTimePicker
              aria-invalid={Boolean(form.formState.errors.qual_start)}
              id="tournament-qual-start"
              placeholder={t("tournament.admin.form.fields.qualStart")}
              value={qualStart}
              onChange={(value) => form.setValue("qual_start", value, { shouldDirty: true, shouldValidate: true })}
            />
          </Field>
          <Field error={form.formState.errors.qual_end?.message} id="tournament-qual-end" label={t("tournament.admin.form.fields.qualEnd")}>
            <DateTimePicker
              aria-invalid={Boolean(form.formState.errors.qual_end)}
              id="tournament-qual-end"
              placeholder={t("tournament.admin.form.fields.qualEnd")}
              value={qualEnd}
              onChange={(value) => form.setValue("qual_end", value, { shouldDirty: true, shouldValidate: true })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("tournament.admin.form.sections.competition")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field error={form.formState.errors.team_size_min?.message} id="tournament-team-size-min" label={t("tournament.admin.form.fields.teamSizeMin")}>
            <Input id="tournament-team-size-min" type="number" {...form.register("team_size_min", { valueAsNumber: true })} />
          </Field>
          <Field error={form.formState.errors.team_size_max?.message} id="tournament-team-size-max" label={t("tournament.admin.form.fields.teamSizeMax")}>
            <Input id="tournament-team-size-max" type="number" {...form.register("team_size_max", { valueAsNumber: true })} />
          </Field>
          <Field error={form.formState.errors.qual_top_n?.message} id="tournament-qual-top-n" label={t("tournament.admin.form.fields.qualTopN")}>
            <Input id="tournament-qual-top-n" type="number" {...form.register("qual_top_n", { valueAsNumber: true })} />
          </Field>
          <Field error={form.formState.errors.qual_rank_mode?.message} id="tournament-qual-rank-mode" label={t("tournament.admin.form.fields.qualRankMode")}>
            <Controller
              control={form.control}
              name="qual_rank_mode"
              render={({ field, fieldState }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger aria-invalid={fieldState.invalid} className="w-full" id="tournament-qual-rank-mode">
                    <SelectValue placeholder={t("tournament.admin.form.fields.qualRankMode")} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    <SelectItem value={String(QUAL_RANK_MODE_TOTAL_SCORE)}>{t("tournament.admin.form.rankModes.totalScore")}</SelectItem>
                    <SelectItem value={String(QUAL_RANK_MODE_RANK_SUM)}>{t("tournament.admin.form.rankModes.rankSum")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </CardContent>
      </Card>

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

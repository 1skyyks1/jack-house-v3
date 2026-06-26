import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Eye, FilePlus, Trash } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useForm, useWatch } from "react-hook-form"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { z } from "zod"
import {
  useCreateTournamentSectionMutation,
  useDeleteTournamentSectionMutation,
  usePreviewTournamentMarkdownMutation,
  useTournamentManageSectionsQuery,
  useTournamentDetailQuery,
  useUpdateTournamentSectionMutation,
  type TournamentSection,
  type TournamentSectionRequest,
} from "@/entities/tournament"
import { RichTextRenderer } from "@/features/rich-text/renderer"
import { AdminPage } from "@/features/admin-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AppAlert, FormFieldError, getErrorMessage, MutationErrorAlert, PageState } from "@/shared/components"
import { cn } from "@/lib/utils"

const sectionTypes = ["rules", "description", "prize", "faq"] as const

function createSectionSchema(t: (key: string) => string) {
  return z.object({
  sort_order: z.number().int().min(0).max(9999),
  source_markdown: z.string().trim().min(1, t("tournament.admin.content.validationMarkdownRequired")),
  title: z.string().trim().min(1, t("tournament.admin.content.validationTitleRequired")).max(255, t("tournament.admin.content.validationTitleMax")),
  type: z.enum(sectionTypes),
  })
}

type SectionFormValues = z.infer<ReturnType<typeof createSectionSchema>>

const defaultValues: SectionFormValues = {
  sort_order: 0,
  source_markdown: "",
  title: "",
  type: "rules",
}

export function AdminTournamentContentPage() {
  const { t } = useTranslation()
  const { tid } = useParams()
  const tournamentQuery = useTournamentDetailQuery(tid)
  const sectionsQuery = useTournamentManageSectionsQuery(tid)
  const createMutation = useCreateTournamentSectionMutation(tid ?? "")
  const updateMutation = useUpdateTournamentSectionMutation(tid ?? "")
  const deleteMutation = useDeleteTournamentSectionMutation(tid ?? "")
  const previewMutation = usePreviewTournamentMarkdownMutation(tid ?? "")
  const [selectedId, setSelectedId] = useState<number | null | undefined>(undefined)
  const [deletingSection, setDeletingSection] = useState<TournamentSection | null>(null)
  const form = useForm<SectionFormValues>({
    defaultValues,
    resolver: zodResolver(createSectionSchema(t)),
  })

  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data])
  const selectedSection = typeof selectedId === "number" ? sections.find((section) => section.id === selectedId) ?? null : selectedId === undefined ? sections[0] ?? null : null
  const isCreating = selectedId === null
  const isMutating = createMutation.isPending || updateMutation.isPending
  const sectionType = useWatch({ control: form.control, name: "type" })
  const sourceMarkdown = useWatch({ control: form.control, name: "source_markdown" }) ?? ""
  const deferredMarkdown = useDeferredValue(sourceMarkdown)
  const previewMarkdown = previewMutation.mutate
  const previewHtml = deferredMarkdown.trim() ? previewMutation.data?.content_html ?? selectedSection?.content_html ?? "" : ""

  useEffect(() => {
    if (selectedSection) {
      form.reset(toSectionFormValues(selectedSection))
    }
  }, [form, selectedSection])

  useEffect(() => {
    const source = deferredMarkdown.trim()
    if (!tid || !source) return

    const timer = window.setTimeout(() => {
      previewMarkdown({ source_markdown: deferredMarkdown })
    }, 450)

    return () => window.clearTimeout(timer)
  }, [deferredMarkdown, previewMarkdown, tid])

  const startCreate = () => {
    setSelectedId(null)
    previewMutation.reset()
    form.reset(defaultValues)
  }

  const submit = form.handleSubmit((values) => {
    const request = toSectionRequest(values)
    if (selectedSection) {
      updateMutation.mutate({ request, sectionId: selectedSection.id }, {
        onSuccess: (section) => {
          toast.success(t("tournament.admin.content.saved"))
          setSelectedId(section.id)
        },
      })
      return
    }

    createMutation.mutate(request, {
      onSuccess: (section) => {
        toast.success(t("tournament.admin.content.created"))
        setSelectedId(section.id)
        form.reset(toSectionFormValues(section))
      },
    })
  })

  if (tournamentQuery.isError || sectionsQuery.isError) {
    return <PageState title={t("tournament.admin.content.loadFailed")} description={getErrorMessage(tournamentQuery.error ?? sectionsQuery.error)} />
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
      {sectionsQuery.isLoading || tournamentQuery.isLoading ? <PageState title={t("tournament.admin.content.loading")} description={t("tournament.admin.content.loadingDescription")} /> : null}

      {!sectionsQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="self-start">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("tournament.admin.content.sections")}</CardTitle>
              <Button onClick={startCreate} size="sm" type="button">
                <FilePlus className="size-4" />
                {t("tournament.admin.content.new")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.length === 0 ? <AppAlert title={t("tournament.admin.content.noContentTitle")}>{t("tournament.admin.content.noContentDescription")}</AppAlert> : null}
              {sections.map((section) => (
                <Button
                  className={cn(
                    "h-auto w-full justify-start rounded-lg border bg-background px-3 py-2 text-left hover:border-primary/40",
                    selectedId === section.id && "border-primary/50 bg-primary/5",
                  )}
                  key={section.id}
                  onClick={() => setSelectedId(section.id)}
                  type="button"
                  variant="ghost"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{section.title}</span>
                      <Badge variant="outline">{section.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("tournament.admin.content.order", { order: section.sort_order })}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {createMutation.isError ? <MutationErrorAlert error={createMutation.error} title={t("tournament.admin.content.createFailed")} /> : null}
            {updateMutation.isError ? <MutationErrorAlert error={updateMutation.error} title={t("tournament.admin.content.saveFailed")} /> : null}
            {deleteMutation.isError ? <MutationErrorAlert error={deleteMutation.error} title={t("tournament.admin.content.deleteFailed")} /> : null}
            {previewMutation.isError ? <MutationErrorAlert error={previewMutation.error} title={t("tournament.admin.content.previewFailed")} /> : null}

            <form className="space-y-4" onSubmit={submit}>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{isCreating ? t("tournament.admin.content.newContent") : t("tournament.admin.content.editContent")}</CardTitle>
                  {!isCreating && selectedSection ? (
                    <Button onClick={() => setDeletingSection(selectedSection)} size="sm" type="button" variant="outline">
                      <Trash className="size-4" />
                      {t("tournament.admin.content.delete")}
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-[1fr_160px_120px]">
                  <Field className="md:col-span-3" error={form.formState.errors.title?.message} id="section-title" label={t("tournament.admin.content.title")}>
                    <Input id="section-title" {...form.register("title")} />
                  </Field>
                  <Field error={form.formState.errors.type?.message} id="section-type" label={t("tournament.admin.content.type")}>
                    <Select
                      onValueChange={(value) => form.setValue("type", value as SectionFormValues["type"], { shouldDirty: true, shouldValidate: true })}
                      value={sectionType}
                    >
                      <SelectTrigger className="w-full" id="section-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field error={form.formState.errors.sort_order?.message} id="section-sort-order" label={t("tournament.admin.content.sortOrder")}>
                    <Input id="section-sort-order" type="number" {...form.register("sort_order", { valueAsNumber: true })} />
                  </Field>
                  <div className="hidden md:block" />
                  <Field className="md:col-span-3" error={form.formState.errors.source_markdown?.message} id="section-markdown" label={t("tournament.admin.content.markdown")}>
                    <Textarea
                      className="min-h-80 font-mono text-sm"
                      id="section-markdown"
                      placeholder={t("tournament.admin.content.markdownPlaceholder")}
                      {...form.register("source_markdown")}
                    />
                  </Field>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button disabled={isMutating} type="submit">
                  {isMutating ? t("tournament.admin.form.saving") : isCreating ? t("tournament.admin.content.createSubmit") : t("tournament.admin.content.saveSubmit")}
                </Button>
              </div>
            </form>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{t("tournament.admin.content.preview")}</CardTitle>
                  <Badge variant={previewMutation.isPending ? "secondary" : "outline"}>
                    {previewMutation.isPending ? t("tournament.admin.content.rendering") : t("tournament.admin.content.sanitized")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {previewHtml ? (
                  <RichTextRenderer content={previewHtml} />
                ) : (
                  <AppAlert title={t("tournament.admin.content.noPreviewTitle")}>{t("tournament.admin.content.noPreviewDescription")}</AppAlert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      <AlertDialog onOpenChange={(open) => !open && setDeletingSection(null)} open={Boolean(deletingSection)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tournament.admin.content.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tournament.admin.content.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("tournament.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deletingSection) return
                deleteMutation.mutate(deletingSection.id, {
                  onSuccess: () => {
                    toast.success(t("tournament.admin.content.deleted"))
                    setDeletingSection(null)
                    setSelectedId(null)
                    form.reset(defaultValues)
                  },
                })
              }}
            >
              {t("tournament.admin.content.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  )
}

function Field({ children, className, error, id, label }: { children: ReactNode; className?: string; error?: string; id: string; label: string }) {
  return (
    <div className={className}>
      <Label className="mb-2 block" htmlFor={id}>{label}</Label>
      {children}
      <FormFieldError message={error} />
    </div>
  )
}

function toSectionFormValues(section: TournamentSection): SectionFormValues {
  return {
    sort_order: section.sort_order ?? 0,
    source_markdown: section.source_markdown ?? "",
    title: section.title ?? "",
    type: sectionTypes.includes(section.type as SectionFormValues["type"]) ? section.type as SectionFormValues["type"] : "rules",
  }
}

function toSectionRequest(values: SectionFormValues): TournamentSectionRequest {
  return {
    format: "markdown",
    sort_order: values.sort_order,
    source_markdown: values.source_markdown,
    title: values.title.trim(),
    type: values.type,
  }
}
